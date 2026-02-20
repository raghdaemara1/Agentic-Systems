from __future__ import annotations

from typing import Any, Callable, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama
from langgraph.graph import END, StateGraph

from app.core.config import settings
from app.services.rag.vectorstore import query_similar


EmitFn = Callable[[dict[str, Any]], None]


class AgentState(TypedDict, total=False):
    query: str
    plan: str
    retrieved: list[dict[str, Any]]
    answer: str
    emit: EmitFn


def _emit(state: AgentState, event: dict[str, Any]) -> None:
    emit = state.get("emit")
    if emit:
        emit(event)


def plan_node(state: AgentState) -> dict[str, Any]:
    plan = "Plan: retrieve relevant context → reason → synthesize answer"
    _emit(state, {"tool": "planner", "thought": plan})
    _emit(state, {"tool": "memory", "thought": "Checking memory: no user profile configured (demo)"})
    return {"plan": plan}


def retrieve_node(state: AgentState) -> dict[str, Any]:
    q = state["query"]
    _emit(state, {"tool": "search", "thought": "Retrieving relevant chunks from vector index"})
    hits = query_similar(query_text=q, k=4)
    _emit(state, {"tool": "executor", "thought": f"Retrieved {len(hits)} chunks"})
    return {"retrieved": hits}


def synthesize_node(state: AgentState) -> dict[str, Any]:
    q = state["query"]
    retrieved = state.get("retrieved", [])

    context = "\n\n".join(
        [
            f"[{i+1}] {h.get('metadata', {}).get('filename','doc')} (dist={h.get('distance'):.4f})\n{h.get('text','')}"
            for i, h in enumerate(retrieved)
        ]
    )

    _emit(state, {"tool": "router", "thought": "Routing synthesis to Ollama chat model"})
    llm = ChatOllama(model=settings.ollama_chat_model, base_url=settings.ollama_base_url, temperature=0.2)

    system = SystemMessage(
        content=(
            "You are an agentic assistant. Use the provided retrieved context when helpful. "
            "If the context is empty or irrelevant, answer from general knowledge and say so."
        )
    )
    user = HumanMessage(
        content=(
            f"User question:\n{q}\n\n"
            f"Retrieved context:\n{context if context.strip() else '(none)'}\n\n"
            "Answer clearly in markdown. If you used retrieved context, include a short 'Sources' list "
            "referring to the numbered chunks."
        )
    )

    _emit(state, {"tool": "executor", "thought": "Generating final answer"})
    resp = llm.invoke([system, user])
    answer = getattr(resp, "content", str(resp))
    _emit(state, {"tool": "memory", "thought": "Storing: completed run summary stored in DB (conversation/runs/steps)"})
    return {"answer": answer}


def build_graph():
    g = StateGraph(AgentState)
    g.add_node("plan", plan_node)
    g.add_node("retrieve", retrieve_node)
    g.add_node("synthesize", synthesize_node)
    g.set_entry_point("plan")
    g.add_edge("plan", "retrieve")
    g.add_edge("retrieve", "synthesize")
    g.add_edge("synthesize", END)
    return g.compile()


_compiled = None


def run_agent(*, query: str, emit: EmitFn | None = None) -> dict[str, Any]:
    global _compiled
    if _compiled is None:
        _compiled = build_graph()
    return _compiled.invoke({"query": query, "emit": emit})


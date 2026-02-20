# ⚡ Agentic AI System — Production Demo

> A portfolio-ready **agentic AI architecture demo UI** that visualizes **reasoning steps, planning, memory updates, tool execution, and model routing**.

**Note:** This repo is a **frontend simulation** (React). It demonstrates the *patterns* and *trace UI* you’d expect in a production agentic system, but it does not include a backend LangGraph/FastAPI implementation.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![LangGraph](https://img.shields.io/badge/LangGraph-Orchestration-FF6B35?style=flat-square)
![LLM](https://img.shields.io/badge/LLMs-GPT--4o%20%2F%20Claude-7C3AED?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production--Ready-10B981?style=flat-square)

---

## 🧠 What This Demonstrates

This interactive demo simulates the internal workings of a production agentic AI system — the kind that goes far beyond simple prompt → response patterns. It shows:

| Capability | Implementation |
|---|---|
| **Reasoning** | Chain-of-thought visible per agent step |
| **Planning** | Planner agent decomposes goals before execution |
| **Memory** | Persistent context stored and retrieved across turns |
| **Tool Use** | 5 specialized tools invoked dynamically |
| **Model Routing** | LLM selected per subtask (GPT-4o vs Claude) |
| **Orchestration** | LangGraph-style state machine coordination |

---

## 🚀 Live Scenarios

### 1. Research & Summarize
Agent autonomously searches, extracts, synthesizes and formats a technical report — with memory informing output style preferences.

### 2. Multi-Step Data Analysis
Agent analyzes sales data, cross-references historical memory from prior sessions, detects anomalies, and generates strategic recommendations.

### 3. Autonomous Task Execution
Agent monitors an API, detects an incident, diagnoses root cause, applies a fix, validates recovery, and notifies the team — zero human input.

---

## 🏗️ Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────────────┐
│           LangGraph Router              │
│   (Intent Classification + Routing)     │
└──────┬──────────┬──────────┬────────────┘
       │          │          │
  ┌────▼───┐ ┌───▼────┐ ┌───▼──────┐
  │Planner │ │Memory  │ │  Router  │
  │ Agent  │ │ Store  │ │(LLM Sel.)│
  └────┬───┘ └───┬────┘ └───┬──────┘
       │         │          │
  ┌────▼─────────▼──────────▼────────┐
  │         Execution Layer          │
  │   Search │ Code Exec │ Retrieval │
  └──────────────────────────────────┘
       │
  ┌────▼──────────────┐
  │  Synthesis + Output│
  └────────────────────┘
```

For a repo-level breakdown of the actual code structure, see `docs/ARCHITECTURE.md`.

---

## 🛠️ Tech Stack

**Frontend Demo**
- React 18 with hooks
- IBM Plex Mono typography
- CSS animations for real-time agent trace visualization

**Production Implementation Would Use**
- `LangGraph` — declarative state machine orchestration
- `LangChain` — tool abstractions, prompt management
- `OpenAI GPT-4o` — reasoning, code execution subtasks
- `Anthropic Claude` — synthesis, long-form generation
- `Pinecone / Weaviate` — vector retrieval
- `Neo4j` — knowledge graph traversal
- `FastAPI` — production API layer
- `LangSmith` — observability and tracing
- `Pydantic` — typed agent communication schemas

---

## 💡 Key Design Decisions

**Why Multi-Agent over Single Pipeline?**
Complex tasks require fundamentally different reasoning types. Parameter lookups need SQL. Fault diagnosis needs graph traversal. Document search needs semantic similarity. A single pipeline compromises on all three.

**Why LangGraph for Orchestration?**
Declarative state machines make agent logic transparent and debuggable. You can unit test transitions, replay failed executions, and trace exactly what happened in production failures.

**Why Persistent Memory?**
Stateless agents force users to repeat context every session. Production agents must accumulate user preferences, prior decisions, and domain knowledge — just like a human colleague would.

**Why Dynamic LLM Routing?**
No single model is optimal for every subtask. GPT-4o excels at code and tool use. Claude excels at long-form synthesis and instruction following. Routing per task type reduces cost by ~40% while improving output quality.

---

## 🏃 Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open `http://localhost:5173` and select any scenario to run.

---

## 📁 Project Structure

```
Agentic-Systems/
├── docs/
│   └── ARCHITECTURE.md
├── src/
│   ├── components/
│   │   └── AgenticDemo.jsx        # Main UI + state machine runner
│   ├── data/
│   │   └── agenticDemoData.js     # Tools + scenarios (steps + outputs)
│   ├── main.jsx                  # React entry point
│   └── styles.css                # Global styles + animations
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔗 Related Projects

- [Industrial AI Agent for Document Intelligence](https://github.com/raghdaemara1/Industrial-AI-Agent-for-Document-Intelligence-Machine-State-Analytics) — Production multi-agent system for manufacturing
- [Hybrid RAG System](https://github.com/raghdaemara1) — Neo4j + Vector retrieval architecture
- [Predictive Maintenance System](https://github.com/raghdaemara1) — 92% accuracy XGBoost + LangGraph

---

## 👩‍💻 Author

**Raghda Emara** — Senior AI Engineer  
Specializing in production-grade agentic RAG systems, multi-agent orchestration, and industrial AI.

🏆 MIMA Middle East 2025 Award — AI Systems Innovation  
🔗 [LinkedIn](https://linkedin.com/in/raghda-emara) | [GitHub](https://github.com/raghdaemara1) | [Email](mailto:raghda.emara22@gmail.com)

from __future__ import annotations

import datetime as dt
import json
import queue
import threading
import uuid
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.models import AgentRun, AgentStep, Conversation, Message
from app.db.session import get_db
from app.services.agent.graph import run_agent

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


class RunRequest(BaseModel):
    query: str
    conversation_id: str | None = None


def _sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/run")
def run(req: RunRequest, db: Session = Depends(get_db)):
    conv_id = req.conversation_id or str(uuid.uuid4())
    conv = db.get(Conversation, conv_id)
    if conv is None:
        conv = Conversation(id=conv_id)
        db.add(conv)
        db.commit()

    db.add(Message(conversation_id=conv_id, role="user", content=req.query))

    run_row = AgentRun(conversation_id=conv_id, user_query=req.query, status="running")
    db.add(run_row)
    db.commit()

    q: queue.Queue[dict[str, Any] | None] = queue.Queue()

    def emit(ev: dict[str, Any]) -> None:
        q.put({"type": "step", "data": ev})

    def worker() -> None:
        try:
            result = run_agent(query=req.query, emit=emit)
            q.put({"type": "done", "data": {"answer": result.get("answer", "")}})
        except Exception as e:
            q.put({"type": "error", "data": {"message": str(e)}})
        finally:
            q.put(None)

    threading.Thread(target=worker, daemon=True).start()

    def gen():
        step_idx = 0
        try:
            yield _sse("meta", {"conversation_id": conv_id, "run_id": run_row.id})
            while True:
                item = q.get()
                if item is None:
                    break

                typ = item["type"]
                payload = item["data"]

                if typ == "step":
                    db.add(
                        AgentStep(
                            run_id=run_row.id,
                            idx=step_idx,
                            tool=payload.get("tool", "tool"),
                            thought=payload.get("thought", ""),
                            payload_json=json.dumps(payload, ensure_ascii=False),
                        )
                    )
                    db.commit()
                    step_idx += 1
                    yield _sse("step", payload)
                elif typ == "done":
                    answer = payload.get("answer", "")
                    db.add(Message(conversation_id=conv_id, role="assistant", content=answer))
                    run_row.status = "completed"
                    run_row.finished_at = dt.datetime.utcnow()
                    db.commit()
                    yield _sse("done", {"answer": answer})
                elif typ == "error":
                    run_row.status = "error"
                    run_row.finished_at = dt.datetime.utcnow()
                    db.commit()
                    yield _sse("error", payload)
        finally:
            pass

    return StreamingResponse(gen(), media_type="text/event-stream")


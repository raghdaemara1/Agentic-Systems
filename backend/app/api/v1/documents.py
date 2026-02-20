from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Chunk, Document
from app.db.session import get_db
from app.services.rag.chunking import chunk_text
from app.services.rag.extract import extract_text
from app.services.rag.vectorstore import upsert_chunks

router = APIRouter()


@router.get("")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "content_type": d.content_type,
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]


@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content_type = file.content_type or "application/octet-stream"
    suffix = Path(file.filename or "").suffix or ""

    if suffix.lower() not in {".txt", ".md", ".pdf"}:
        raise HTTPException(status_code=400, detail="Only .txt, .md, .pdf are supported")

    os.makedirs(settings.upload_dir, exist_ok=True)
    doc_id = str(uuid.uuid4())
    stored_name = f"{doc_id}{suffix.lower()}"
    stored_path = str(Path(settings.upload_dir) / stored_name)

    raw = await file.read()
    Path(stored_path).write_bytes(raw)

    try:
        text = extract_text(stored_path, content_type)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    chunks = chunk_text(text, chunk_size=1000, overlap=200)
    if not chunks:
        raise HTTPException(status_code=400, detail="No extractable text found")

    doc = Document(
        id=doc_id,
        filename=file.filename or stored_name,
        content_type=content_type,
        storage_path=stored_path,
    )
    db.add(doc)

    chunk_rows: list[Chunk] = []
    chunk_ids: list[str] = []
    metadatas: list[dict] = []
    for i, ch in enumerate(chunks):
        chunk_id = str(uuid.uuid4())
        chunk_ids.append(chunk_id)
        chunk_rows.append(Chunk(id=chunk_id, document_id=doc_id, idx=i, text=ch))
        metadatas.append(
            {
                "document_id": doc_id,
                "chunk_idx": i,
                "filename": doc.filename,
            }
        )

    for row in chunk_rows:
        db.add(row)

    db.commit()

    upsert_chunks(ids=chunk_ids, texts=chunks, metadatas=metadatas)

    return {"document_id": doc_id, "chunks_indexed": len(chunks)}


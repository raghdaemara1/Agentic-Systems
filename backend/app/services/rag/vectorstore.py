from __future__ import annotations

import os
from typing import Any

import chromadb
from chromadb.api.models.Collection import Collection
from langchain_ollama import OllamaEmbeddings

from app.core.config import settings


_client: chromadb.PersistentClient | None = None
_collection: Collection | None = None
_embeddings: OllamaEmbeddings | None = None


def get_embeddings() -> OllamaEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = OllamaEmbeddings(model=settings.ollama_embed_model, base_url=settings.ollama_base_url)
    return _embeddings


def get_collection() -> Collection:
    global _client, _collection
    if _collection is not None:
        return _collection

    os.makedirs(settings.vector_dir, exist_ok=True)
    _client = chromadb.PersistentClient(path=settings.vector_dir)
    _collection = _client.get_or_create_collection(name="documents")
    return _collection


def upsert_chunks(*, ids: list[str], texts: list[str], metadatas: list[dict[str, Any]]) -> None:
    if not ids:
        return
    emb = get_embeddings()
    vectors = emb.embed_documents(texts)
    col = get_collection()
    col.upsert(ids=ids, documents=texts, metadatas=metadatas, embeddings=vectors)


def query_similar(*, query_text: str, k: int = 4) -> list[dict[str, Any]]:
    emb = get_embeddings()
    qvec = emb.embed_query(query_text)
    col = get_collection()
    res = col.query(query_embeddings=[qvec], n_results=k, include=["documents", "metadatas", "distances", "ids"])

    out: list[dict[str, Any]] = []
    ids = res.get("ids", [[]])[0] or []
    docs = res.get("documents", [[]])[0] or []
    metas = res.get("metadatas", [[]])[0] or []
    dists = res.get("distances", [[]])[0] or []

    for i in range(min(len(ids), len(docs), len(metas), len(dists))):
        out.append(
            {
                "id": ids[i],
                "text": docs[i],
                "metadata": metas[i],
                "distance": dists[i],
            }
        )
    return out


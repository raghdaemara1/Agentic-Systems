from __future__ import annotations


def chunk_text(text: str, *, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    cleaned = (text or "").strip()
    if not cleaned:
        return []

    chunks: list[str] = []
    start = 0
    n = len(cleaned)

    while start < n:
        end = min(start + chunk_size, n)
        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == n:
            break
        start = max(0, end - overlap)

    return chunks


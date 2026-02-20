from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader


def extract_text(path: str, content_type: str) -> str:
    p = Path(path)
    if content_type in {"text/plain", "text/markdown"} or p.suffix.lower() in {".txt", ".md"}:
        return p.read_text(encoding="utf-8", errors="ignore")

    if content_type == "application/pdf" or p.suffix.lower() == ".pdf":
        reader = PdfReader(str(p))
        parts: list[str] = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
        return "\n\n".join(parts).strip()

    raise ValueError(f"Unsupported content type: {content_type}")


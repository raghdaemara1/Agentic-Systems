# Backend (FastAPI)

## Prereqs
- Python 3.10+
- Ollama running locally (`ollama serve`) and models pulled

## Setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Health check: `http://localhost:8000/health`


# Agentic AI System — Full-Stack RAG + LangGraph Demo Platform

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.1.0-009688?style=flat-square&logo=fastapi)
![LangGraph](https://img.shields.io/badge/LangGraph-Orchestration-FF6B35?style=flat-square)
![Ollama](https://img.shields.io/badge/Ollama-Local%20LLMs-10B981?style=flat-square)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-7C3AED?style=flat-square)

> **A full-stack agentic AI system combining a React visualization layer with a real FastAPI + LangGraph backend that accepts document uploads, embeds them into ChromaDB via Ollama, and answers user queries through a three-node planning-retrieval-synthesis graph streamed live as Server-Sent Events.**

---

## What Does This App Do?

| Feature | What You Can Do |
|---|---|
| **Document Ingestion** | Upload `.txt`, `.md`, or `.pdf` files; the backend extracts text, splits it into 1,000-character overlapping chunks, embeds each chunk with `nomic-embed-text` via Ollama, and upserts into ChromaDB |
| **Agentic RAG Queries** | Submit a natural language query; a LangGraph state machine runs three nodes (plan, retrieve, synthesize) and returns a markdown answer grounded in indexed document chunks |
| **Live Execution Trace** | Every agent step streams to the browser via Server-Sent Events with tool name and reasoning thought, animating in real time |
| **Conversation Persistence** | Each chat session is stored in SQLite under a UUID conversation ID with full message history, run records, and per-step audit rows |
| **Interactive Demo Scenarios** | Three pre-built scenarios (Research & Summarize, Multi-Step Reasoning, Autonomous Task Execution) visualize agent behavior with scripted step data for portfolio presentation |
| **Agent Memory Panel** | The sidebar surfaces the last five memory-tagged step thoughts extracted from the SSE stream, updating live as the agent emits memory events |
| **Document Library** | A sidebar panel calls `GET /api/v1/documents` on mount and after every upload to show all indexed files |
| **Health Monitoring** | Both the root server and the agent sub-router expose `/health` endpoints returning `{"status": "ok"}` |

---

## Quick Start

```bash
# 1. Start Ollama and pull required models
ollama serve
ollama pull llama3.1
ollama pull nomic-embed-text

# 2. Start the FastAPI backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Start the React frontend (new terminal, from repo root)
npm install
npm run dev
```

Open `http://localhost:5173`. Backend health check: `http://localhost:8000/health`.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Browser (localhost:5173)                        │
│                                                                     │
│  ┌───────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  Tool Sidebar  │  │ Execution Trace │  │   Agent Output      │  │
│  │  (AGENT_TOOLS) │  │ (SSE steps)     │  │   (final answer)    │  │
│  └───────┬───────┘  └────────┬────────┘  └──────────┬──────────┘  │
│          │                   │                        │             │
│          └───────────────────┴────────────────────────┘            │
│                         AgenticDemo.jsx                             │
│              POST /api/v1/agent/run  |  POST /api/v1/documents/upload│
│              GET  /api/v1/documents                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                                │  HTTP / SSE  (Vite proxy → :8000)
┌──────────────────────────────▼──────────────────────────────────────┐
│                   FastAPI  (app/main.py)                            │
│                   CORS middleware, /health                          │
│                                                                     │
│  ┌─────────────────────────────┐  ┌────────────────────────────┐   │
│  │   /api/v1/agent             │  │   /api/v1/documents        │   │
│  │   agent.py                  │  │   documents.py             │   │
│  │                             │  │                            │   │
│  │  POST /run                  │  │  GET  /                    │   │
│  │    → RunRequest(query,      │  │  POST /upload              │   │
│  │       conversation_id)      │  │                            │   │
│  │    → threading.Thread       │  │  extract_text()            │   │
│  │    → StreamingResponse      │  │  chunk_text()              │   │
│  │       (text/event-stream)   │  │  upsert_chunks()           │   │
│  └─────────────┬───────────────┘  └────────────────────────────┘   │
└────────────────┼────────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────────┐
│              LangGraph State Machine  (services/agent/graph.py)     │
│                                                                     │
│   AgentState ──► plan_node() ──► retrieve_node() ──► synthesize_node()│
│                  (planner)        (search)           (router/executor)│
│                     │                │                    │         │
│                  emits SSE        query_similar()      ChatOllama   │
│                  step events      k=4 hits             .invoke()    │
└───────────────────────┬─────────────────┬──────────────────────────┘
                        │                 │
          ┌─────────────▼──┐    ┌─────────▼──────────────┐
          │   SQLite        │    │   ChromaDB             │
          │   app.db        │    │   backend/storage/     │
          │                 │    │   vector/              │
          │  conversations  │    │                        │
          │  messages       │    │  collection:           │
          │  agent_runs     │    │  "documents"           │
          │  agent_steps    │    │  (ids, embeddings,     │
          │  documents      │    │   metadatas, texts)    │
          │  chunks         │    └────────────┬───────────┘
          └─────────────────┘                 │
                                    ┌─────────▼───────────┐
                                    │   Ollama            │
                                    │   :11434            │
                                    │                     │
                                    │  nomic-embed-text   │
                                    │  (embeddings)       │
                                    │                     │
                                    │  llama3.1           │
                                    │  (chat/synthesis)   │
                                    └─────────────────────┘
```

---

## The Pipelines

### Pipeline 1 — Document Ingestion

A user selects a `.txt`, `.md`, or `.pdf` file in the Documents sidebar panel. The frontend POSTs the file as `multipart/form-data` to `/api/v1/documents/upload`. The backend validates the file extension, stores the raw bytes to disk, extracts plain text, chunks it with a sliding window, computes Ollama embeddings, and upserts both the SQL metadata and the ChromaDB vectors. The result is a `{document_id, chunks_indexed}` JSON response and the document appearing in the library list.

```
[File input onChange → uploadDocument(file)]
      │
      ▼
1. FormData POST to /api/v1/documents/upload in AgenticDemo.jsx
      │  multipart file upload
      ▼
2. upload_document() in documents.py — validates suffix ∈ {.txt, .md, .pdf},
   generates UUID doc_id, writes raw bytes to settings.upload_dir/
      │
      ▼
3. extract_text() in rag/extract.py — reads plain text via Path.read_text()
   for .txt/.md, or iterates PdfReader.pages for .pdf via pypdf
      │
      ▼
4. chunk_text() in rag/chunking.py — sliding-window split:
   chunk_size=1000 chars, overlap=200 chars → list[str]
      │  raises HTTP 400 if chunks list is empty
      ▼
5. Document row inserted into SQLite documents table (id, filename,
   content_type, storage_path, created_at)
      │
      ▼
6. Chunk rows inserted into SQLite chunks table (id, document_id,
   idx, text) — one row per chunk
      │
      ▼
7. upsert_chunks() in rag/vectorstore.py — calls OllamaEmbeddings
   (nomic-embed-text) to compute embedding vectors for all chunk texts
      │
      ▼
8. ChromaDB PersistentClient.get_or_create_collection("documents")
   .upsert(ids, documents, metadatas, embeddings) — stored to vector_dir/
      │
      ▼
9. HTTP 200 → {"document_id": "<uuid>", "chunks_indexed": N}
   Frontend calls loadDocuments() to refresh the sidebar list
```

---

### Pipeline 2 — Agentic RAG Query (SSE Streaming)

A user clicks a scenario button (or triggers a query) in the UI. The frontend POSTs `{query, conversation_id}` to `/api/v1/agent/run`. The API layer immediately starts streaming Server-Sent Events: first a `meta` event with IDs, then `step` events as the LangGraph graph executes, then a final `done` event containing the markdown answer. The browser renders each incoming step into the Execution Trace column as it arrives.

```
[runScenario(scenario) in AgenticDemo.jsx]
      │  POST /api/v1/agent/run  {query, conversation_id}
      ▼
1. run() in agent.py — creates/fetches Conversation row in SQLite,
   inserts user Message row, creates AgentRun row with status="running"
      │
      ▼
2. threading.Thread(target=worker).start() — run_agent() called off the
   main thread; results pushed to a queue.Queue
      │
      ▼
3. StreamingResponse(gen(), media_type="text/event-stream") returned
   immediately; gen() is a generator that blocks on q.get()
      │
      ▼
4. _sse("meta", {conversation_id, run_id}) yielded immediately to client
      │
      ▼
5. run_agent() in services/agent/graph.py — lazily compiles the LangGraph
   StateGraph on first call; invokes compiled graph with {query, emit}
      │
      ├── plan_node(state) ──────────────────────────────────────────┐
      │   emits {tool:"planner", thought:"Plan: retrieve..."}        │
      │   emits {tool:"memory",  thought:"Checking memory..."}       │
      │   returns {plan: "Plan: retrieve..."}                        │
      │                                                              │
      ├── retrieve_node(state) ────────────────────────────────────┐ │
      │   emits {tool:"search",  thought:"Retrieving chunks..."}   │ │
      │   query_similar(query_text=q, k=4) in vectorstore.py:      │ │
      │     OllamaEmbeddings.embed_query(q) → query vector         │ │
      │     ChromaDB collection.query(embeddings, n_results=4)     │ │
      │   emits {tool:"executor", thought:"Retrieved N chunks"}    │ │
      │   returns {retrieved: list[{id, text, metadata, distance}]}│ │
      │                                                            │ │
      └── synthesize_node(state) ──────────────────────────────────┘ │
          emits {tool:"router",   thought:"Routing synthesis..."}     │
          builds context string from retrieved chunks with distance   │
          ChatOllama(model=llama3.1, temperature=0.2).invoke(         │
            [SystemMessage, HumanMessage with context])               │
          emits {tool:"executor", thought:"Generating final answer"}  │
          emits {tool:"memory",   thought:"Storing: completed run..."}│
          returns {answer: "<markdown string>"}                       │
      │                                                              │
      ▼  (each emit() call → q.put({type:"step", data:ev}))         │
6. gen() in agent.py dequeues each item:                            │
   ├── type=="step" → inserts AgentStep row (run_id, idx, tool,    │
   │                   thought, payload_json) → yields _sse("step") │
   ├── type=="done" → inserts assistant Message, sets              │
   │                   AgentRun.status="completed", finished_at    │
   │                   → yields _sse("done", {answer})             │
   └── type=="error" → sets AgentRun.status="error"               │
                        → yields _sse("error", {message})          │
      │
      ▼
7. Browser SSE reader in AgenticDemo.jsx parses event/data blocks:
   ├── "meta"  → setConversationId()
   ├── "step"  → setCompletedSteps([...prev, step]), setActiveTool()
   │             if tool=="memory": setMemory() with extracted thought
   ├── "done"  → setFinalAnswer(), setShowResult(true), setIsRunning(false)
   └── "error" → setError()
      │
      ▼
8. Execution Trace column renders each step card with tool chip +
   thought text; Agent Output panel renders final markdown answer
```

---

### Pipeline 3 — Document Library Load

Triggered on component mount and after every successful upload. A lightweight read-only pipeline with no backend mutation.

```
[useEffect(loadDocuments, []) on mount  OR  after uploadDocument() resolves]
      │
      ▼
1. loadDocuments() in AgenticDemo.jsx — fetch GET /api/v1/documents
      │
      ▼
2. list_documents() in documents.py — db.query(Document)
   .order_by(Document.created_at.desc()).all()
      │
      ▼
3. Returns JSON array [{id, filename, content_type, created_at}]
      │
      ▼
4. setDocuments(data) → Documents sidebar renders up to 8 filenames
```

---

## Core Component Structure

```
Agentic-Systems/
│
├── src/                                      # React frontend (Vite)
│   ├── components/
│   │   └── AgenticDemo.jsx                   # Root component: owns all UI state,
│   │                                         # SSE parsing, file upload, scenario runner
│   ├── data/
│   │   └── agenticDemoData.js                # AGENT_TOOLS map (5 tools with icon/color)
│   │                                         # SCENARIOS array (3 demo flows with
│   │                                         # scripted steps and pre-written results)
│   ├── main.jsx                              # ReactDOM.createRoot mounts AgenticDemo
│   └── styles.css                            # Dark theme, .agent-card, .tool-chip,
│                                             # .step-enter/@keyframes slideIn,
│                                             # .active-tool-glow, .grid-bg
│
└── backend/
    └── app/
        ├── main.py                           # FastAPI app factory: registers CORS,
        │                                     # mounts v1_router, runs Base.metadata.create_all
        ├── core/
        │   └── config.py                     # Settings(BaseSettings): reads .env,
        │                                     # exposes database_url, ollama_*, upload_dir,
        │                                     # vector_dir, allowed_origins
        ├── api/v1/
        │   ├── routes.py                     # Assembles /api/v1 router from agent + documents
        │   ├── agent.py                      # POST /run: SSE streaming with threading + queue;
        │   │                                 # GET  /health
        │   └── documents.py                  # POST /upload: full ingestion pipeline;
        │                                     # GET  /: document list
        ├── db/
        │   ├── models.py                     # SQLAlchemy ORM: Conversation, Message,
        │   │                                 # AgentRun, AgentStep, Document, Chunk
        │   ├── session.py                    # create_engine + SessionLocal + get_db()
        │   └── migrations/                   # Alembic env.py wired to settings.database_url
        └── services/
            ├── agent/
            │   └── graph.py                  # LangGraph StateGraph: AgentState TypedDict,
            │                                 # plan_node / retrieve_node / synthesize_node,
            │                                 # build_graph() → compiled singleton,
            │                                 # run_agent(query, emit) entry point
            └── rag/
                ├── extract.py                # extract_text(): plain text for .txt/.md,
                │                             # PdfReader page iteration for .pdf
                ├── chunking.py               # chunk_text(): sliding window char splitter
                │                             # (chunk_size=1000, overlap=200)
                └── vectorstore.py            # OllamaEmbeddings singleton, ChromaDB
                                              # PersistentClient singleton,
                                              # upsert_chunks() and query_similar()
```

---

## Key Decision Logic — Agent Query Routing Flowchart

```
POST /api/v1/agent/run received
      │
      ▼
┌─────────────────────────────────┐
│  Does conversation_id exist     │
│  in request body?               │
└────────┬────────────────────────┘
         │ No                     │ Yes
         ▼                        ▼
  Generate new UUID       Load existing Conversation
  Create Conversation     row from SQLite
  row in SQLite
         │                        │
         └───────────┬────────────┘
                     ▼
         Insert user Message row (role="user")
         Insert AgentRun row (status="running")
                     │
                     ▼
         Launch background Thread → run_agent()
         Return StreamingResponse immediately
                     │
                     ▼
         ┌─────────────────────────┐
         │   LangGraph: plan_node  │
         │   Always executes;      │
         │   returns fixed plan    │
         └────────────┬────────────┘
                      ▼
         ┌─────────────────────────┐
         │ retrieve_node:          │
         │ query_similar(k=4)      │
         │                         │
         │ Are there docs in       │
         │ ChromaDB collection?    │
         └──────┬──────────────────┘
                │ Yes               │ No (empty collection)
                ▼                   ▼
         Returns up to 4      Returns empty list []
         chunk hits with       synthesize_node gets
         distances             context = "(none)"
                │                   │
                └────────┬──────────┘
                         ▼
              ┌────────────────────────────┐
              │  synthesize_node:          │
              │  Build context string from │
              │  retrieved chunks          │
              │                            │
              │  ChatOllama(llama3.1,       │
              │  temperature=0.2).invoke() │
              └────────────┬───────────────┘
                           │
                           ▼
              ┌────────────────────────────┐
              │  gen() generator reads     │
              │  from queue:               │
              │                            │
              │  item type?                │
              ├── "step" ──► persist       │
              │              AgentStep,    │
              │              yield SSE     │
              ├── "done" ──► persist       │
              │              assistant Msg,│
              │              set status=   │
              │              "completed",  │
              │              yield SSE     │
              └── "error" ─► set status=  │
                             "error",      │
                             yield SSE     │
                           └──────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend UI | React 18 (hooks) | Component-local state with `useState`/`useEffect` is sufficient for this single-page app; no global store needed |
| Frontend build | Vite 4 + `@vitejs/plugin-react` | Sub-second HMR during development; Vite's dev proxy eliminates CORS issues when hitting the FastAPI backend on :8000 |
| Frontend fonts | IBM Plex Mono (Google Fonts) | Monospace typeface reinforces the terminal/agent execution aesthetic across tool chips and trace lines |
| Backend framework | FastAPI | Async-capable, native `StreamingResponse` for SSE, automatic OpenAPI docs, Pydantic request validation |
| LLM orchestration | LangGraph (StateGraph) | Declarative node-and-edge graph makes agent control flow inspectable and unit-testable; avoids callback spaghetti |
| LLM client | LangChain-Ollama (`ChatOllama`, `OllamaEmbeddings`) | Wraps Ollama REST API with LangChain message types, keeping the synthesize node model-swappable |
| Local LLM runtime | Ollama | Runs `llama3.1` and `nomic-embed-text` locally with no API key or egress cost |
| Vector store | ChromaDB (PersistentClient) | File-system-backed, zero-infra vector DB adequate for demo scale; client is a singleton to avoid re-opening on each request |
| Relational DB | SQLite via SQLAlchemy ORM | Zero-configuration for local dev; Alembic migration support ready for Postgres upgrade in production |
| Schema migrations | Alembic | Migration scripts wired to `settings.database_url` so switching to Postgres requires only an env var change |
| PDF extraction | pypdf | Pure-Python PDF reader; no system-level dependencies like Poppler |
| Concurrency model | Python `threading` + `queue.Queue` | `run_agent()` is synchronous (LangGraph `invoke`); a daemon thread isolates it from FastAPI's event loop while the generator drains the queue |
| Settings | pydantic-settings | `.env` file loaded automatically; type-checked fields with sensible defaults; no manual `os.getenv` calls |

---

## How to Run It

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com) installed and running

### 1. Pull Ollama models

```bash
ollama serve                     # start the Ollama daemon if not already running
ollama pull llama3.1             # chat model used in synthesize_node
ollama pull nomic-embed-text     # embedding model used in upsert_chunks and query_similar
```

### 2. Configure the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` (all values have defaults, so this step is optional for local dev):

```env
DATABASE_URL=sqlite:///./backend/storage/app.db
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=llama3.1
OLLAMA_EMBED_MODEL=nomic-embed-text
UPLOAD_DIR=./backend/storage/uploads
VECTOR_DIR=./backend/storage/vector
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Start the backend

```bash
# from the repo root (so relative storage paths resolve correctly)
uvicorn backend.app.main:app --reload --port 8000

# or from inside the backend/ directory:
cd backend
uvicorn app.main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/health` → `{"status":"ok"}`

### 4. Start the frontend

```bash
# from the repo root
npm install
npm run dev
```

Open `http://localhost:5173`.

### 5. Verify end-to-end

1. Upload a `.txt` or `.pdf` file using the Documents panel.
2. Click "Research & Summarize" to run the full agent pipeline.
3. Watch steps appear in the Execution Trace; the final answer renders in Agent Output.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | No | `sqlite:///./backend/storage/app.db` | SQLAlchemy connection URL; swap to `postgresql+psycopg2://...` for Postgres |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | Base URL of the Ollama HTTP API |
| `OLLAMA_CHAT_MODEL` | No | `llama3.1` | Model name passed to `ChatOllama` in `synthesize_node` |
| `OLLAMA_EMBED_MODEL` | No | `nomic-embed-text` | Model name passed to `OllamaEmbeddings` for chunk indexing and query embedding |
| `UPLOAD_DIR` | No | `./backend/storage/uploads` | Filesystem directory where uploaded files are written |
| `VECTOR_DIR` | No | `./backend/storage/vector` | Directory where ChromaDB persists its on-disk vector index |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | Comma-separated list of CORS origins; split and applied to `CORSMiddleware` |

---

## API Reference

All routes are prefixed `/api/v1`.

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/health` | GET | None | Root health check; returns `{"status": "ok"}` |
| `/api/v1/agent/health` | GET | None | Agent sub-router health check; returns `{"status": "ok"}` |
| `/api/v1/agent/run` | POST | None | Accepts `RunRequest {query: str, conversation_id?: str}`; returns `text/event-stream` of SSE events: `meta`, `step`, `done`, `error` |
| `/api/v1/documents` | GET | None | Returns JSON array of all documents ordered by `created_at` desc: `[{id, filename, content_type, created_at}]` |
| `/api/v1/documents/upload` | POST | None | Accepts `multipart/form-data` with a `file` field (`.txt`/`.md`/`.pdf`); runs full ingestion pipeline; returns `{document_id, chunks_indexed}` |

### SSE Event Schema (`POST /api/v1/agent/run`)

```
event: meta
data: {"conversation_id": "<uuid>", "run_id": "<uuid>"}

event: step
data: {"tool": "planner|search|executor|router|memory", "thought": "<string>"}

event: done
data: {"answer": "<markdown string>"}

event: error
data: {"message": "<error string>"}
```

---

## Key Design Decisions

**Why a background thread + `queue.Queue` instead of `async` for the LangGraph call?**
LangGraph's `StateGraph.invoke()` is synchronous. Wrapping it in `asyncio.run_in_executor` inside an async FastAPI handler creates event-loop nesting issues. A daemon thread owns the blocking call and pushes results into a thread-safe queue; the SSE generator drains that queue synchronously, matching FastAPI's `StreamingResponse` model without any async complexity.

**Why SQLite for conversation storage rather than an in-memory dict?**
In-memory state is lost on server restart and cannot be inspected externally. SQLite persists the full `conversations → messages → agent_runs → agent_steps` hierarchy with timestamps, enabling replay, debugging, and future analytics queries at zero infrastructure cost during development.

**Why ChromaDB `PersistentClient` as a module-level singleton?**
Opening a new `PersistentClient` on every request would re-read the on-disk index repeatedly and incur unnecessary I/O. A module-level singleton is initialized once and reused across all requests within the same process, which is safe because ChromaDB's persistent client is thread-safe for read/upsert operations.

**Why `chunk_size=1000, overlap=200` in `chunk_text()`?**
1,000 characters fits comfortably inside `nomic-embed-text`'s context window while keeping each chunk semantically coherent. A 200-character overlap means boundary-spanning concepts appear in two adjacent chunks, preventing retrieval misses when a key phrase straddles a split point.

**Why `temperature=0.2` in `ChatOllama` inside `synthesize_node()`?**
Factual question-answering grounded in retrieved documents benefits from low temperature to reduce hallucination and produce stable, reproducible output. The system prompt explicitly instructs the model to cite numbered chunks, and low temperature keeps those citations accurate.

**Why Vite's dev proxy for `/api` instead of CORS whitelisting from the frontend origin?**
The Vite proxy rewrites `/api/*` requests to `http://localhost:8000/api/*` at the network level, so the browser sees same-origin requests and CORS never triggers. This is simpler to configure than maintaining origin lists in both the frontend build and the backend `ALLOWED_ORIGINS` var, and mirrors a common production reverse-proxy pattern.

**Why keep `AGENT_TOOLS` and `SCENARIOS` in a separate `agenticDemoData.js` data file?**
Separating static content from render logic means the `AgenticDemo.jsx` component focuses solely on state transitions and rendering. Adding a new scenario or tool requires touching only the data file, with no risk of introducing bugs in the SSE parsing or upload logic.

---

## Production Readiness

| Current (Dev) | Production Recommendation |
|---|---|
| SQLite (`app.db`) | Replace `DATABASE_URL` with `postgresql+psycopg2://...`; run Alembic migrations; connection pool via `pool_size` / `max_overflow` in `create_engine` |
| Ollama on localhost | Deploy Ollama on a GPU-backed instance (e.g., AWS G4dn) or replace `ChatOllama` / `OllamaEmbeddings` with OpenAI / Anthropic SDK calls by swapping the LangChain provider |
| ChromaDB `PersistentClient` on local disk | Replace with ChromaDB's HTTP client pointing to a dedicated Chroma server, or swap `vectorstore.py` to use `langchain-pinecone` / `langchain-weaviate` |
| `Base.metadata.create_all` on startup | Remove from `main.py`; gate schema changes behind Alembic `alembic upgrade head` in CI/CD pipeline |
| Single Uvicorn worker | Run with `gunicorn -k uvicorn.workers.UvicornWorker --workers N`; LangGraph compiled singleton is process-local so each worker builds its own (acceptable overhead) |
| No authentication | Add OAuth2 / API-key middleware to FastAPI; pass user identity into `Conversation` rows for per-user isolation |
| `ALLOWED_ORIGINS=http://localhost:5173` | Set `ALLOWED_ORIGINS` to the production frontend domain in environment config |
| No request timeout on SSE | Add an asyncio or thread timeout guard to `worker()` so stalled Ollama calls do not hold SSE connections open indefinitely |
| `threading.Thread(daemon=True)` | For high-concurrency workloads, replace with a task queue (Celery + Redis) and push SSE frames over a pub/sub channel (Redis Streams) |

---

## Project File Map

```
Agentic-Systems/
├── index.html                              Vite HTML entry; sets page title, mounts #root
├── package.json                            npm scripts (dev/build/preview), React 18 + Vite deps
├── vite.config.js                          Vite dev server: proxies /api → :8000
├── .gitignore                              Excludes node_modules, dist, .env, backend/storage
├── docs/
│   └── ARCHITECTURE.md                    Narrative description of frontend-only demo patterns
└── src/
│   ├── main.jsx                            ReactDOM.createRoot renders <AgenticDemo />
│   ├── styles.css                          Global dark theme: .agent-card, .tool-chip,
│   │                                       .step-enter slideIn, .active-tool-glow, .grid-bg
│   ├── components/
│   │   └── AgenticDemo.jsx                 Full UI: manages 10 pieces of React state,
│   │                                       SSE stream parser, file upload handler,
│   │                                       scenario runner, three-column layout render
│   └── data/
│       └── agenticDemoData.js              AGENT_TOOLS: 5 tool definitions (memory, planner,
│                                           search, executor, router); SCENARIOS: 3 demo
│                                           flows with scripted steps and pre-written results
└── backend/
    ├── requirements.txt                    fastapi, uvicorn, pydantic-settings, sqlalchemy,
    │                                       alembic, langgraph, langchain-core,
    │                                       langchain-ollama, chromadb, pypdf
    ├── alembic.ini                         Alembic config pointing to app/db/migrations
    └── app/
        ├── main.py                         FastAPI app: CORS middleware, router mount,
        │                                   Base.metadata.create_all, /health endpoint
        ├── core/
        │   └── config.py                   Settings class: 7 typed fields, reads .env
        ├── api/v1/
        │   ├── routes.py                   Assembles /api/v1 from agent + documents routers
        │   ├── agent.py                    POST /run SSE handler + GET /health;
        │   │                               RunRequest model, _sse() formatter,
        │   │                               threading + queue streaming pattern
        │   └── documents.py                POST /upload ingestion endpoint;
        │                                   GET / document list endpoint
        ├── db/
        │   ├── models.py                   6 SQLAlchemy ORM models: Conversation, Message,
        │   │                               AgentRun, AgentStep, Document, Chunk
        │   ├── session.py                  create_engine with SQLite check_same_thread fix,
        │   │                               SessionLocal, get_db() dependency
        │   └── migrations/
        │       └── env.py                  Alembic env: reads settings.database_url,
        │                                   supports offline and online migration modes
        └── services/
            ├── agent/
            │   └── graph.py               AgentState TypedDict, plan_node/retrieve_node/
            │                               synthesize_node functions, build_graph(),
            │                               run_agent() with compiled singleton cache
            └── rag/
                ├── extract.py             extract_text(): .txt/.md via Path.read_text,
                │                          .pdf via PdfReader.pages iteration
                ├── chunking.py            chunk_text(): character sliding-window splitter
                └── vectorstore.py         get_embeddings() / get_collection() singletons,
                                           upsert_chunks(), query_similar()
```

---

*Built with FastAPI · LangGraph · LangChain-Ollama · ChromaDB · SQLAlchemy · Alembic · React 18 · Vite · pypdf · pydantic-settings*

# SETUP.md — CubitaxAI v2 Setup Guide

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** (20 recommended)
- **Docker Desktop** (for containerized deployment)

---

## Option A: Local Development (No Docker)

### 1. Clone and configure
```bash
cp .env.example .env
# Edit .env with your API keys (OpenAI, Pinecone, Cohere are optional for dev)
```

### 2. Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start the API server
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will start with graceful fallbacks:
- SQLite instead of PostgreSQL
- In-memory store instead of Redis
- Local embeddings instead of OpenAI
- No Neo4j/ChromaDB (logs warnings, continues)

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000

### 4. Create a test user
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'
```

---

## Option B: Docker Compose (Full Stack)

### 1. Configure
```bash
cp .env.example .env.docker
# Edit .env.docker — the default values already use Docker service hostnames
```

### 2. Build and start
```bash
docker compose --env-file .env.docker up -d --build
```

### 3. Verify
```bash
# Check all services are healthy
docker compose ps

# Test the API
curl http://localhost:8000/health
```

### Services and Ports

| Service | Host Port | Description |
|---------|-----------|-------------|
| Frontend (nginx) | 3000 | React app served by nginx |
| Backend API | 8000 | FastAPI with uvicorn |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache and Celery broker |
| Neo4j Browser | 7474 | Graph DB web interface |
| Neo4j Bolt | 7687 | Graph DB query port |
| ChromaDB | 8001 | Vector database |

### Stop
```bash
docker compose down          # Stop containers
docker compose down -v       # Stop and delete all data volumes
```

---

## Project Structure

```
cubitaxai/
├── backend/
│   ├── app/
│   │   ├── agents/          # LangGraph agent nodes
│   │   ├── api/             # FastAPI route handlers
│   │   ├── memory/          # Redis, vector store, episodic memory
│   │   ├── middleware/      # Rate limiter, circuit breaker
│   │   ├── models/          # SQLAlchemy models + Pydantic schemas
│   │   ├── observability/   # Logging, tracing, metrics
│   │   ├── services/        # Business logic (auth, embedder, tax rules)
│   │   ├── tasks/           # Celery background tasks
│   │   ├── config.py        # Settings from environment
│   │   ├── database.py      # Async SQLAlchemy engine
│   │   └── main.py          # FastAPI app factory
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client
│   │   ├── components/      # React components
│   │   ├── context/         # Auth context
│   │   ├── hooks/           # useAuth, useChat, useTheme
│   │   ├── pages/           # Route pages
│   │   └── styles/          # Tailwind globals
│   ├── Dockerfile
│   └── package.json
├── nginx/                   # Production nginx config
├── docker-compose.yml
├── .env                     # Local dev config
├── .env.docker              # Docker config
└── .env.example             # Template with docs
```

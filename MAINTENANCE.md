# CubitaxAI — Maintenance & Operations Guide

## Table of Contents

1. [Document Ingestion](#1-document-ingestion)
2. [Neo4j Knowledge Graph Updates](#2-neo4j-knowledge-graph-updates)
3. [API Key Rotation](#3-api-key-rotation)
4. [RAGAS Evaluation](#4-ragas-evaluation)
5. [Retrieval Tuning](#5-retrieval-tuning)
6. [Database Management](#6-database-management)
7. [Monitoring & Alerts](#7-monitoring--alerts)
8. [Docker Operations](#8-docker-operations)

---

## 1. Document Ingestion

### Adding New Tax Legislation

1. **Upload via API:**
   ```bash
   curl -X POST http://localhost:8000/api/upload/document \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@path/to/document.pdf"
   ```

2. **Monitor processing:**
   ```bash
   curl http://localhost:8000/api/upload/documents/${DOC_ID}/status \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Verify indexing:**
   - Check document status transitions: `UPLOADING → PROCESSING → INDEXED`
   - If stuck at `PROCESSING`, check Celery worker logs:
     ```bash
     docker compose logs celery-worker --tail=100
     ```

### Bulk Ingestion

For bulk ingestion of legislation updates, use the Celery task directly:

```python
from app.tasks.celery_tasks import process_document
for doc in documents:
    process_document.delay(doc_id=doc.id, user_id=admin_id, file_path=doc.path)
```

### Troubleshooting Ingestion Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| Document stays `PROCESSING` | Celery worker not running | `docker compose restart celery-worker` |
| Document status `FAILED` | PDF parsing error | Check Celery logs; may need OCR fallback |
| Chunks indexed but search returns nothing | Embedding dimension mismatch | Verify `OPENAI_API_KEY` is set and valid |
| Duplicate rejection (409) | Same content hash exists | Archive the existing document first |

---

## 2. Neo4j Knowledge Graph Updates

### Adding New Section Relationships

```cypher
-- Connect a new section to its parent Act
MERGE (s:Section {id: "Sec 194Q", name: "TDS on purchase of goods"})
MERGE (a:Act {id: "IT_ACT", name: "Income Tax Act"})
MERGE (s)-[:BELONGS_TO]->(a)

-- Add cross-references between sections
MATCH (s1:Section {id: "Sec 194C"})
MATCH (s2:Section {id: "Sec 194J"})
MERGE (s1)-[:RELATED_TO {relationship: "contractor_vs_professional"}]->(s2)
```

### Refreshing the Knowledge Graph

```bash
# Connect to Neo4j browser
open http://localhost:7474

# Verify node counts
MATCH (n) RETURN labels(n), count(n) ORDER BY count(n) DESC

# Clear and rebuild (CAUTION: deletes all data)
MATCH (n) DETACH DELETE n
```

### Regular Maintenance

- **Weekly:** Run `CALL db.info()` to monitor graph size
- **Monthly:** Review orphaned nodes: `MATCH (n) WHERE NOT (n)--() RETURN n`
- **After legislation changes:** Run the graph builder script:
  ```bash
  docker compose exec backend python -m app.scripts.build_graph
  ```

---

## 3. API Key Rotation

### OpenAI

1. Generate a new key at https://platform.openai.com/api-keys
2. Update `.env` or `.env.docker`:
   ```
   OPENAI_API_KEY=sk-new-key-here
   ```
3. Restart services:
   ```bash
   docker compose restart backend celery-worker
   ```
4. **Verify:** Check the health endpoint:
   ```bash
   curl http://localhost:8000/health | jq '.components[] | select(.name=="openai")'
   ```

### Pinecone

1. Generate at https://app.pinecone.io → API Keys
2. Update `PINECONE_API_KEY` in environment
3. Restart backend services
4. **Verify:** Index connectivity via health check

### Cohere

1. Generate at https://dashboard.cohere.com/api-keys
2. Update `COHERE_API_KEY` in environment
3. Restart backend services
4. **Note:** If Cohere is down, the system falls back to lexical reranking

### Neo4j

1. Update password in Neo4j:
   ```cypher
   ALTER CURRENT USER SET PASSWORD FROM 'old_pw' TO 'new_pw'
   ```
2. Update `NEO4J_PASSWORD` in environment
3. Restart backend services

### JWT Secret Key

> ⚠️ **CAUTION:** Rotating `SECRET_KEY` invalidates ALL existing tokens. Plan for user re-authentication.

1. Generate a new 64-character secret:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```
2. Update `SECRET_KEY` in environment
3. Restart all services

---

## 4. RAGAS Evaluation

### Running an Evaluation

```bash
# Via Celery task
docker compose exec backend python -c "
from app.tasks.celery_tasks import run_ragas_evaluation
result = run_ragas_evaluation.delay('tests/golden_qa.json')
print(result.get(timeout=300))
"
```

### Golden Test Set Format

Create `tests/golden_qa.json`:

```json
[
  {
    "question": "What is the TDS rate under Section 194J?",
    "expected_answer": "10% for professional/technical fees exceeding ₹30,000",
    "contexts": ["Section 194J of the Income Tax Act..."],
    "ground_truth": "The TDS rate under Section 194J is 10%."
  }
]
```

### Interpreting Results

| Metric | Target | Action if Below |
|--------|--------|-----------------|
| Faithfulness | > 0.85 | Add more context documents |
| Context Recall | > 0.80 | Tune BM25/dense weights |
| Answer Relevancy | > 0.80 | Improve prompt templates |

---

## 5. Retrieval Tuning

### Manual Weight Adjustment

The query classifier (`app/services/query_classifier.py`) controls BM25 vs dense weights:

| Query Type | BM25 Weight | Dense Weight |
|------------|-------------|-------------|
| Section Lookup | 0.70 | 0.30 |
| Calculation | 0.00 | 0.00 (skip) |
| Deadline Check | 0.40 | 0.60 |
| General | 0.45 | 0.55 |

### Auto-Tuning

Weekly auto-tuning runs via Celery Beat (Sunday 2 AM IST):
```
celery_app.conf.beat_schedule["weekly-retrieval-tuning"]
```

To trigger manually:
```bash
docker compose exec backend python -c "
from app.tasks.celery_tasks import auto_tune_retrieval
auto_tune_retrieval.delay()
"
```

---

## 6. Database Management

### Alembic Migrations

```bash
# Generate a new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker compose exec backend alembic upgrade head

# Rollback one step
docker compose exec backend alembic downgrade -1
```

### Backup

```bash
# PostgreSQL backup
docker compose exec postgres pg_dump -U cubitax cubitax > backup.sql

# Neo4j backup
docker compose exec neo4j neo4j-admin dump --to=/data/backup.dump

# Redis backup (trigger RDB save)
docker compose exec redis redis-cli BGSAVE
```

### Connection Pool Monitoring

Check active connections in PostgreSQL:
```sql
SELECT count(*), state FROM pg_stat_activity
WHERE datname = 'cubitax' GROUP BY state;
```

The pool is configured with:
- `pool_size`: 10 (default from Settings)
- `max_overflow`: 20

---

## 7. Monitoring & Alerts

### Health Check

```bash
# Full health check
curl http://localhost:8000/health | jq

# Prometheus metrics
curl http://localhost:8000/observability/metrics
```

### Key Metrics to Watch

| Metric | Alert Threshold | Dashboard |
|--------|----------------|-----------|
| `cubitax_query_latency_seconds{quantile="0.95"}` | > 10s | Response time |
| `cubitax_total_queries` | Sudden drop | Traffic |
| `cubitax_circuit_breaker_trips` | > 0 | LLM stability |
| `cubitax_auth_failures` | > 50/hour | Security |

### Log Analysis

```bash
# Structured JSON logs from backend
docker compose logs backend --tail=100 | jq 'select(.event == "request_completed")'

# Filter by correlation ID
docker compose logs backend | grep "abc123correlation"
```

---

## 8. Docker Operations

### Full Stack Start

```bash
docker compose --env-file .env.docker up -d --build
```

### Service-Specific Restart

```bash
# Backend only (no rebuild)
docker compose restart backend

# Rebuild and restart a specific service
docker compose up -d --build backend

# Scale Celery workers
docker compose up -d --scale celery-worker=3
```

### Emergency Recovery

```bash
# If backend is crash-looping
docker compose logs backend --tail=50
docker compose restart backend

# If Redis OOM
docker compose exec redis redis-cli FLUSHDB  # ⚠️ clears chat history

# Nuclear option — fresh start
docker compose down -v  # ⚠️ deletes all volumes
docker compose up -d --build
```

### Resource Monitoring

```bash
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

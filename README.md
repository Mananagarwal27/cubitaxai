# CubitaxAI

> GenAI-based Tax & Compliance Software

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=flat-square)
![LangGraph](https://img.shields.io/badge/LangGraph-Workflow-111827?style=flat-square)
![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-14B8A6?style=flat-square)

![CubitaxAI logo placeholder](https://placehold.co/1200x320/1E1B4B/F8FAFC?text=CubitaxAI)

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [API Docs](#api-docs)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

CubitaxAI is a production-style full-stack tax compliance platform tailored for Indian businesses, founders, and finance teams. It combines document intelligence, retrieval-augmented generation, deterministic tax calculations, and workflow automation inside a single operational dashboard.

The backend is built around FastAPI, async SQLAlchemy, Redis-backed memory, and a LangGraph orchestration layer that routes user queries through retrieval, calculation, compliance analysis, and self-critique stages. Knowledge is indexed into a vector layer that can search both curated tax references and user-uploaded filing documents.

The frontend is a responsive React dashboard with authentication, deadline tracking, document management, KPI monitoring, and a streaming AI assistant. Docker, CI, and seed tooling are included so the project can be run locally, tested in automation, and extended like a real portfolio-grade product.

## Architecture

```text
┌─────────────────────────────── Frontend ───────────────────────────────┐
│ React 18 + Tailwind + React Query + Recharts + EventSource Chat        │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────── FastAPI API ──────────────────────────────┐
│ Auth │ Dashboard │ Upload │ Chat │ Reports │ Health                     │
└───────────────┬───────────────┬───────────────┬─────────────────────────┘
                │               │               │
                ▼               ▼               ▼
        PostgreSQL        Redis Memory     Celery Worker
                │               │               │
                └───────────────┴───────┬───────┘
                                        ▼
                            LangGraph Orchestrator
                   Retriever │ Calculator │ Compliance │ Writer
                                        │
                                        ▼
                      Pinecone / Chroma Knowledge + User Documents
```

## Features

- [x] JWT-based authentication with user profiles
- [x] Async PDF upload pipeline with Celery ingestion hooks
- [x] Section-aware document chunking for tax materials
- [x] Hybrid vector retrieval over global knowledge and user documents
- [x] Multi-agent LangGraph orchestration for chat responses
- [x] Compliance deadline tracking and alert generation
- [x] Downloadable markdown-to-PDF report generation
- [x] Responsive dashboard with metrics, uploads, deadlines, and chat
- [x] Docker Compose setup for full-stack local development
- [x] GitHub Actions workflow for backend, frontend, and Docker verification

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, React Router 6, Tailwind CSS 3, Axios, React Query, Recharts, Framer Motion |
| Backend | FastAPI, SQLAlchemy 2, Celery, Redis, LangChain, LangGraph, OpenAI, Pinecone, Chroma |
| Data | PostgreSQL, Redis, Pinecone, ChromaDB |
| AI/RAG | OpenAI embeddings, Cohere reranking, LangGraph multi-agent orchestration |
| Ops | Docker, Docker Compose, GitHub Actions |

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.11
- OpenAI, Pinecone, and Cohere API keys

## Getting Started

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in the required API keys.
3. Run `docker compose up --build`.
4. Run the seed script with `docker exec backend python scripts/seed_knowledge_base.py`.
5. Open [http://localhost:3000](http://localhost:3000).

## API Docs

Swagger UI is exposed by the FastAPI backend at [http://localhost:8000/docs](http://localhost:8000/docs).

## Project Structure

```text
.
├── backend/
│   ├── app/
│   ├── scripts/
│   └── tests/
├── frontend/
│   ├── public/
│   └── src/
├── docker-compose.yml
├── docker-compose.dev.yml
└── .github/workflows/ci.yml
```

## Contributing

1. Create a feature branch from `main`.
2. Keep changes covered by tests where practical.
3. Run backend tests and the frontend build locally before opening a PR.
4. Submit focused pull requests with clear descriptions and screenshots for UI changes.

## License

MIT


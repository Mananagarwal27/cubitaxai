# FIXES.md — CubitaxAI v2 Bug Fixes

**Date:** 2026-04-03  

---

## BUG-01: Login `isLoading` property mismatch
- **Severity:** HIGH  
- **Root cause:** `AuthContext.jsx` exposes `loading` but `Login.jsx` destructures `isLoading`
- **Fix:** Added `isLoading: loading` alias to context value

## BUG-02: `.env` uses Docker hostnames for local dev
- **Severity:** HIGH  
- **Fix:** Restored localhost URLs. Created separate `.env.docker` for Docker.

## BUG-03: Missing `.dockerignore` files
- **Severity:** MEDIUM  
- **Fix:** Created `backend/.dockerignore` and `frontend/.dockerignore`

## BUG-04: Frontend Dockerfile runs dev server in production
- **Severity:** MEDIUM  
- **Fix:** Multi-stage build with nginx serving built assets

## BUG-05: Backend Dockerfile missing PYTHONPATH
- **Severity:** LOW  
- **Fix:** Added `ENV PYTHONPATH=/app` and non-root user

## BUG-06: Docker Compose missing PYTHONPATH for Celery
- **Severity:** MEDIUM  
- **Fix:** Added `PYTHONPATH=/app` to all Python services

## BUG-07: ChromaDB healthcheck uses `python` not `python3`
- **Severity:** LOW  
- **Fix:** Changed to `python3`

## BUG-09: Tailwind color tokens (`navy`, `purple`, `cyan`, `amber`) undefined
- **Severity:** LOW  
- **Fix:** Added color definitions to `tailwind.config.js`

## BUG-12: No multi-stage Docker builds
- **Severity:** MEDIUM  
- **Fix:** Multi-stage builds for both backend and frontend Dockerfiles

## BUG-13: docker-compose.yml env_file pointing to wrong file
- **Severity:** MEDIUM  
- **Fix:** Separate `.env.docker` with Docker service hostnames

## ENV-01: CHROMA_HOST/PORT missing from .env.example
- **Severity:** LOW  
- **Fix:** Added to `.env.example` and `.env`

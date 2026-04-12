"""Chat API routes for synchronous and streaming assistant interactions (v2)."""

from __future__ import annotations

import json
from typing import AsyncGenerator
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.agents.orchestrator import CubitaxOrchestrator
from app.database import get_db
from app.memory.entity_memory import EntityMemoryManager
from app.memory.redis_memory import RedisMemoryManager
from app.memory.vector_store import VectorStoreManager
from app.models.schemas import ChatRequest, ChatResponse
from app.models.user import User
from app.observability.metrics import increment_counter
from app.services.auth_service import get_current_user, verify_token

router = APIRouter()


def _memory(request: Request) -> RedisMemoryManager:
    """Return the app-level Redis memory manager."""
    return request.app.state.redis_memory


def _vector_store(request: Request) -> VectorStoreManager:
    """Return the app-level vector store manager."""
    return request.app.state.vector_store


async def _resolve_stream_user(request: Request, db: AsyncSession, token: str | None) -> User:
    """Resolve a user for SSE streaming via header or query token."""
    header = request.headers.get("authorization", "")
    bearer_token = header.removeprefix("Bearer ").strip() if header.startswith("Bearer ") else token
    if not bearer_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    token_data = verify_token(bearer_token)
    result = await db.execute(select(User).where(User.id == UUID(token_data.sub)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/message", response_model=ChatResponse)
async def send_chat_message(
    payload: ChatRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    """Run the orchestration graph and return a cited answer."""

    memory = _memory(request)
    orchestrator = CubitaxOrchestrator(_vector_store(request))
    history = await memory.get_history(payload.session_id, last_n=10)

    # Entity memory integration
    entity_mgr = EntityMemoryManager()
    await entity_mgr.extract_and_store(str(current_user.id), payload.session_id, payload.query)

    result = await orchestrator.run(
        query=payload.query,
        user_id=str(current_user.id),
        session_id=payload.session_id,
        chat_history=history,
    )

    await memory.save_message(payload.session_id, "user", payload.query, [])
    await memory.save_message(
        payload.session_id,
        "assistant",
        result["final_answer"],
        result.get("citations", []),
    )

    increment_counter("total_queries")

    return ChatResponse(
        answer=result["final_answer"],
        citations=result.get("citations", []),
        query_type=result.get("query_type", "GENERAL"),
        session_id=payload.session_id,
        agent=result.get("active_agent"),
        needs_review=result.get("needs_review", False),
        plan=result.get("plan"),
        critique_scores=result.get("critique_scores"),
    )


@router.get("/stream")
async def stream_chat_message(
    request: Request,
    query: str = Query(..., min_length=2),
    session_id: str = Query(..., min_length=3),
    token: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> EventSourceResponse:
    """Stream a chat response with agent step events over SSE."""

    current_user = await _resolve_stream_user(request, db, token)
    memory = _memory(request)
    orchestrator = CubitaxOrchestrator(_vector_store(request))
    history = await memory.get_history(session_id, last_n=10)

    # Extract entities
    entity_mgr = EntityMemoryManager()
    await entity_mgr.extract_and_store(str(current_user.id), session_id, query)

    async def event_generator() -> AsyncGenerator[dict[str, str], None]:
        """Yield SSE events for agent steps, tokens, citations, and completion."""

        # Emit planning event
        yield {"data": json.dumps({"type": "step", "data": {"agent": "planning_node", "status": "running"}})}

        result = await orchestrator.run(
            query=query,
            user_id=str(current_user.id),
            session_id=session_id,
            chat_history=history,
        )
        await memory.save_message(session_id, "user", query, [])

        # Emit step timings
        for step_name, timing in result.get("step_timings", {}).items():
            yield {"data": json.dumps({
                "type": "step",
                "data": {"agent": step_name, "status": "completed", "duration_ms": round(timing * 1000)},
            })}

        # Emit plan
        if result.get("plan"):
            yield {"data": json.dumps({"type": "plan", "data": result["plan"]})}

        # Stream answer tokens
        answer = result["final_answer"]
        for token_text in answer.split():
            yield {"data": json.dumps({"type": "token", "data": f"{token_text} "})}

        # Emit citations
        for citation in result.get("citations", []):
            yield {"data": json.dumps({"type": "citation", "data": citation})}

        # Emit critique scores
        if result.get("critique_scores"):
            yield {"data": json.dumps({"type": "critique", "data": result["critique_scores"]})}

        # Emit HITL flag
        if result.get("needs_review"):
            yield {"data": json.dumps({"type": "needs_review", "data": True})}

        await memory.save_message(session_id, "assistant", answer, result.get("citations", []))

        # Store episodic memory in background
        try:
            from app.tasks.celery_tasks import store_episodic_memory
            full_history = await memory.get_full_history(session_id)
            if len(full_history) >= 6:
                store_episodic_memory.delay(
                    user_id=str(current_user.id),
                    session_id=session_id,
                    messages=full_history,
                )
        except Exception:
            pass

        yield {"data": json.dumps({"type": "done", "data": {"session_id": session_id}})}

    increment_counter("total_queries")
    return EventSourceResponse(event_generator())


@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    """Return the full stored conversation history for a session."""
    _ = current_user
    history = await _memory(request).get_full_history(session_id)
    return {"session_id": session_id, "messages": history}


@router.delete("/history/{session_id}")
async def clear_chat_history(
    session_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Delete all stored messages for a session."""
    _ = current_user
    await _memory(request).clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}


@router.get("/sessions")
async def list_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
) -> dict[str, list[dict[str, str]]]:
    """List all chat sessions for the current user (from Redis keys)."""
    memory = _memory(request)
    sessions: list[dict[str, str]] = []
    user_id = str(current_user.id)

    if memory.client:
        keys = await memory.client.keys(f"chat:{user_id}:*")
        for key in keys[:50]:
            session_id = key.replace(f"chat:{user_id}:", "")
            first_msg = await memory.client.lindex(key, 0)
            if first_msg:
                msg = json.loads(first_msg)
                sessions.append({
                    "session_id": session_id,
                    "title": msg.get("content", "New conversation")[:80],
                    "created_at": msg.get("created_at", ""),
                })
    else:
        for session_id, messages in memory._fallback_messages.items():
            if not session_id.startswith(user_id):
                continue
            if messages:
                sessions.append({
                    "session_id": session_id,
                    "title": messages[0].get("content", "New conversation")[:80],
                    "created_at": messages[0].get("created_at", ""),
                })

    return {"sessions": sessions}

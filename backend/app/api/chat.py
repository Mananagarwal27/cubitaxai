"""Chat API routes for synchronous and streaming assistant interactions."""

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
from app.memory.redis_memory import RedisMemoryManager
from app.memory.vector_store import VectorStoreManager
from app.models.schemas import ChatRequest, ChatResponse
from app.models.user import User
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
    return ChatResponse(
        answer=result["final_answer"],
        citations=result.get("citations", []),
        query_type=result.get("query_type", "GENERAL"),
        session_id=payload.session_id,
    )


@router.get("/stream")
async def stream_chat_message(
    request: Request,
    query: str = Query(..., min_length=2),
    session_id: str = Query(..., min_length=3),
    token: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> EventSourceResponse:
    """Stream a chat response token-by-token over SSE."""

    current_user = await _resolve_stream_user(request, db, token)
    memory = _memory(request)
    orchestrator = CubitaxOrchestrator(_vector_store(request))
    history = await memory.get_history(session_id, last_n=10)

    async def event_generator() -> AsyncGenerator[dict[str, str], None]:
        """Yield SSE events for tokens, citations, and completion."""

        result = await orchestrator.run(
            query=query,
            user_id=str(current_user.id),
            session_id=session_id,
            chat_history=history,
        )
        await memory.save_message(session_id, "user", query, [])

        answer = result["final_answer"]
        for token_text in answer.split():
            yield {"data": json.dumps({"type": "token", "data": f"{token_text} "})}
        for citation in result.get("citations", []):
            yield {"data": json.dumps({"type": "citation", "data": citation})}
        await memory.save_message(session_id, "assistant", answer, result.get("citations", []))
        yield {"data": json.dumps({"type": "done", "data": {"session_id": session_id}})}

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

"""Redis-backed chat memory with in-memory fallback support."""

from __future__ import annotations

import json
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Optional

from redis.asyncio import Redis

logger = logging.getLogger(__name__)


class RedisMemoryManager:
    """Persist conversation history and user context in Redis."""

    def __init__(self, redis_url: str) -> None:
        """Store Redis connection settings and fallback state."""

        self.redis_url = redis_url
        self.client: Redis | None = None
        self._fallback_messages: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self._fallback_context: dict[str, dict[str, Any]] = {}

    async def initialize(self) -> None:
        """Connect to Redis when available and keep fallback mode otherwise."""

        try:
            self.client = Redis.from_url(self.redis_url, decode_responses=True)
            await self.client.ping()
        except Exception as exc:  # pragma: no cover - depends on environment
            logger.warning("Redis unavailable, using in-memory fallback: %s", exc)
            self.client = None

    async def save_message(
        self,
        session_id: str,
        role: str,
        content: str,
        citations: list[dict[str, Any]] | list[Any],
    ) -> None:
        """Append a chat message to persistent session history."""

        payload = {
            "role": role,
            "content": content,
            "citations": citations,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        if self.client:
            await self.client.rpush(f"chat:{session_id}", json.dumps(payload))
            await self.client.ltrim(f"chat:{session_id}", -200, -1)
            return
        self._fallback_messages[session_id].append(payload)

    async def get_history(self, session_id: str, last_n: int = 10) -> list[dict[str, Any]]:
        """Return the latest N chat messages for a session."""

        if self.client:
            items = await self.client.lrange(f"chat:{session_id}", max(-last_n, -200), -1)
            return [json.loads(item) for item in items]
        return self._fallback_messages[session_id][-last_n:]

    async def get_full_history(self, session_id: str) -> list[dict[str, Any]]:
        """Return the entire stored history for a session."""

        if self.client:
            items = await self.client.lrange(f"chat:{session_id}", 0, -1)
            return [json.loads(item) for item in items]
        return list(self._fallback_messages[session_id])

    async def clear_session(self, session_id: str) -> None:
        """Delete all stored messages for a chat session."""

        if self.client:
            await self.client.delete(f"chat:{session_id}")
            return
        self._fallback_messages.pop(session_id, None)

    async def save_user_context(self, user_id: str, context_dict: dict[str, Any]) -> None:
        """Persist longer-lived user preferences or context."""

        if self.client:
            await self.client.set(f"user-context:{user_id}", json.dumps(context_dict))
            return
        self._fallback_context[user_id] = context_dict

    async def close(self) -> None:
        """Close the Redis connection if it exists."""

        if self.client:
            await self.client.aclose()


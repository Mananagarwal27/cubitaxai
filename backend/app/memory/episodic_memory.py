"""Episodic memory — stores conversation summaries in Pinecone for long-term recall."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.memory.vector_store import VectorStoreManager

logger = logging.getLogger(__name__)


class EpisodicMemoryManager:
    """Summarize completed conversations and store them as searchable memory.

    Each completed conversation is summarized and embedded into Pinecone
    so the assistant can recall past interactions and provide continuity.
    """

    def __init__(self, vector_store: VectorStoreManager) -> None:
        """Bind to the shared vector store."""
        self.vector_store = vector_store

    async def store_episode(
        self,
        user_id: str,
        session_id: str,
        messages: list[dict[str, Any]],
    ) -> str | None:
        """Summarize a conversation and store as a memory chunk.

        Args:
            user_id: Owner of the conversation.
            session_id: Session identifier.
            messages: List of chat messages from the conversation.

        Returns:
            The episode doc_id or None if too few messages.
        """
        if len(messages) < 3:
            return None

        summary = self._build_summary(messages)
        if not summary:
            return None

        namespace = f"user_{user_id}"
        doc_id = f"episode-{uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()

        chunk = {
            "text": summary,
            "doc_type": "EPISODIC_MEMORY",
            "section_ref": "Conversation Memory",
            "session_id": session_id,
            "created_at": now,
            "page_num": 1,
            "effective_date": now,
        }

        await self.vector_store.embed_and_upsert([chunk], namespace, doc_id)
        logger.info("Stored episode for user %s, session %s", user_id, session_id)
        return doc_id

    async def recall_relevant_episodes(
        self,
        user_id: str,
        query: str,
        top_k: int = 3,
    ) -> list[dict[str, Any]]:
        """Search past episodes relevant to the current query."""
        namespace = f"user_{user_id}"
        results = await self.vector_store.hybrid_search(
            query=query,
            namespace=namespace,
            top_k=top_k,
            filter_dict={"doc_type": "EPISODIC_MEMORY"},
        )
        return [
            {
                "text": result.text,
                "session_id": result.metadata.get("session_id", ""),
                "created_at": result.metadata.get("created_at", ""),
                "score": result.score,
            }
            for result in results
        ]

    @staticmethod
    def _build_summary(messages: list[dict[str, Any]]) -> str:
        """Build a concise summary from conversation messages."""
        user_messages = [m["content"] for m in messages if m.get("role") == "user"]
        assistant_messages = [m["content"] for m in messages if m.get("role") == "assistant"]

        if not user_messages:
            return ""

        topics = user_messages[0][:200]
        key_points: list[str] = []

        for msg in assistant_messages[:3]:
            first_line = msg.split("\n")[0][:150]
            if first_line:
                key_points.append(first_line)

        summary_parts = [f"User asked about: {topics}"]
        if key_points:
            summary_parts.append("Key findings: " + "; ".join(key_points))
        summary_parts.append(f"Conversation had {len(messages)} messages.")

        return " ".join(summary_parts)

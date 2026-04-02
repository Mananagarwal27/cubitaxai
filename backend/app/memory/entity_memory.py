"""Long-term entity memory backed by PostgreSQL."""

from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import UUID, DateTime, String, Text, func, select
from sqlalchemy.orm import Mapped, mapped_column

from app.database import AsyncSessionLocal, Base

logger = logging.getLogger(__name__)


class EntityMemoryRecord(Base):
    """Persisted entity extracted from user conversations."""

    __tablename__ = "entity_memories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    key: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    source_session: Mapped[str | None] = mapped_column(String(128), nullable=True)
    extracted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class EntityMemoryManager:
    """Extract and recall entities (PAN, company, FY) from conversations.

    Entities are extracted via regex patterns and stored in PostgreSQL
    for recall across sessions.
    """

    EXTRACTION_PATTERNS = {
        "pan": re.compile(r"\b([A-Z]{5}\d{4}[A-Z])\b"),
        "gstin": re.compile(r"\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2})\b"),
        "financial_year": re.compile(r"\b(FY\s*20\d{2}(?:-\d{2})?)\b", re.IGNORECASE),
        "company": re.compile(r"(?:company|firm|organization|org)\s*(?:is|named?|:)\s*[\"']?([A-Za-z\s&.]+)", re.IGNORECASE),
        "annual_income": re.compile(r"(?:income|salary|earning)\s*(?:is|of|:)\s*(?:₹|INR|Rs\.?)?\s*([\d,]+)", re.IGNORECASE),
    }

    async def extract_and_store(self, user_id: str, session_id: str, text: str) -> dict[str, str]:
        """Extract entities from text and persist new ones.

        Returns dict of extracted entities.
        """
        extracted: dict[str, str] = {}
        for key, pattern in self.EXTRACTION_PATTERNS.items():
            match = pattern.search(text)
            if match:
                value = match.group(1).strip()
                extracted[key] = value

        if extracted:
            async with AsyncSessionLocal() as session:
                for key, value in extracted.items():
                    existing = await session.execute(
                        select(EntityMemoryRecord).where(
                            EntityMemoryRecord.user_id == user_id,
                            EntityMemoryRecord.key == key,
                        )
                    )
                    record = existing.scalar_one_or_none()
                    if record:
                        record.value = value
                        record.source_session = session_id
                        record.extracted_at = datetime.now(timezone.utc)
                    else:
                        session.add(EntityMemoryRecord(
                            user_id=user_id,
                            key=key,
                            value=value,
                            source_session=session_id,
                        ))
                await session.commit()

        return extracted

    async def recall(self, user_id: str) -> dict[str, str]:
        """Retrieve all stored entities for a user."""
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(EntityMemoryRecord).where(EntityMemoryRecord.user_id == user_id)
            )
            records = result.scalars().all()
            return {record.key: record.value for record in records}

    async def get_context_string(self, user_id: str) -> str:
        """Build a natural language summary of known user context."""
        entities = await self.recall(user_id)
        if not entities:
            return ""

        parts: list[str] = ["Known context about this user:"]
        if "company" in entities:
            parts.append(f"- Company: {entities['company']}")
        if "pan" in entities:
            parts.append(f"- PAN: {entities['pan']}")
        if "gstin" in entities:
            parts.append(f"- GSTIN: {entities['gstin']}")
        if "financial_year" in entities:
            parts.append(f"- Financial Year: {entities['financial_year']}")
        if "annual_income" in entities:
            parts.append(f"- Approximate Income: ₹{entities['annual_income']}")
        return "\n".join(parts)

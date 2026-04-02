"""Document database model with versioning and deduplication support."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import UUID, DateTime, Enum as SqlEnum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DocumentType(str, Enum):
    """Supported uploaded and seeded tax document categories."""

    ITR = "ITR"
    GSTR = "GSTR"
    FORM_26AS = "FORM_26AS"
    TDS_CERT = "TDS_CERT"
    GST_CIRCULAR = "GST_CIRCULAR"
    IT_ACT = "IT_ACT"
    GSTR_2B = "GSTR_2B"
    FINANCE_ACT = "FINANCE_ACT"
    OTHER = "OTHER"


class DocumentStatus(str, Enum):
    """Async ingestion lifecycle states for uploaded documents."""

    UPLOADING = "UPLOADING"
    PROCESSING = "PROCESSING"
    INDEXED = "INDEXED"
    FAILED = "FAILED"
    ARCHIVED = "ARCHIVED"


class Document(Base):
    """Persisted metadata for user-uploaded tax and compliance documents."""

    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[DocumentType] = mapped_column(
        SqlEnum(DocumentType, native_enum=False),
        default=DocumentType.OTHER,
        nullable=False,
    )
    status: Mapped[DocumentStatus] = mapped_column(
        SqlEnum(DocumentStatus, native_enum=False),
        default=DocumentStatus.UPLOADING,
        nullable=False,
    )
    chunk_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    pinecone_namespace: Mapped[str] = mapped_column(String(255), nullable=False)

    # Versioning
    content_hash: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    financial_year: Mapped[str | None] = mapped_column(String(10), nullable=True)
    effective_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    indexed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="documents")

"""Organization and API key database models for multi-tenancy."""
from typing import Optional


import secrets
import uuid
from datetime import datetime

from sqlalchemy import UUID, Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Organization(Base):
    """Tenant organization with isolated data namespaces."""

    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    pinecone_namespace: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    max_users: Mapped[int] = mapped_column(Integer, default=25, nullable=False)
    max_documents: Mapped[int] = mapped_column(Integer, default=500, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    members = relationship("User", back_populates="organization")
    api_keys = relationship("APIKey", back_populates="organization", cascade="all, delete-orphan")


class APIKey(Base):
    """Programmatic API key for organization-level machine access."""

    __tablename__ = "api_keys"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(12), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    organization = relationship("Organization", back_populates="api_keys")
    created_by = relationship("User", foreign_keys=[created_by_id])

    @staticmethod
    def generate_key() -> tuple[str, str]:
        """Generate a raw API key and its prefix for display.

        Returns:
            Tuple of (full_key, prefix). The full key is shown once at creation.
        """
        raw = f"ctx_{secrets.token_urlsafe(42)}"
        return raw, raw[:12]

class CAClientRelationship(Base):
    __tablename__ = "ca_client_relationships"
    id = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ca_org_id = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    client_org_id = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"))
    managed_since = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_active = mapped_column(Boolean, default=True)

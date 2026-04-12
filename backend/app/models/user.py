"""User database model with RBAC and multi-tenancy support."""
from typing import Optional


import enum
import uuid
from datetime import datetime

from sqlalchemy import UUID, Boolean, DateTime, Enum as SqlEnum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    """Access control roles for the platform."""

    ADMIN = "admin"
    CA_FIRM = "ca_firm"
    CFO = "cfo"
    ANALYST = "analyst"
    VIEWER = "viewer"
    CLIENT = "client"


class User(Base):
    """Persisted application user with profile, RBAC, and org membership."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    pan_number: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    role: Mapped[UserRole] = mapped_column(
        SqlEnum(UserRole, native_enum=False),
        default=UserRole.ANALYST,
        nullable=False,
    )
    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True
    )
    refresh_token_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    financial_year: Mapped[Optional[str]] = mapped_column(String(10), default="FY2025", nullable=True)

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

    organization = relationship("Organization", back_populates="members")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")

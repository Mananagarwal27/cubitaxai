"""Pydantic request and response schemas for API contracts."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.document import DocumentStatus, DocumentType


class UserCreate(BaseModel):
    """Registration payload for a new user account."""

    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    company_name: str = Field(min_length=2, max_length=255)
    pan_number: str | None = Field(default=None)
    gstin: str | None = Field(default=None)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("pan_number")
    @classmethod
    def validate_pan(cls, value: str | None) -> str | None:
        """Validate PAN format when provided."""

        if value and len(value) == 10 and value[:5].isalpha() and value[5:9].isdigit() and value[9].isalpha():
            return value.upper()
        if value:
            raise ValueError("PAN number must match ABCDE1234F format")
        return value

    @field_validator("gstin")
    @classmethod
    def validate_gstin(cls, value: str | None) -> str | None:
        """Validate GSTIN format when provided."""

        if value and len(value) == 15 and value.isalnum():
            return value.upper()
        if value:
            raise ValueError("GSTIN must be a 15 character alphanumeric value")
        return value


class UserLogin(BaseModel):
    """Login payload for user authentication."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    """Serialized user profile returned by authenticated endpoints."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    company_name: str
    pan_number: str | None
    gstin: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class Token(BaseModel):
    """JWT bearer token payload."""

    access_token: str
    token_type: Literal["bearer"] = "bearer"


class TokenData(BaseModel):
    """Decoded token claims required for user lookup."""

    sub: str | None = None
    email: EmailStr | None = None


class AuthResponse(Token):
    """Authentication response containing token and user profile."""

    user: UserResponse


class DocumentUploadResponse(BaseModel):
    """Response returned immediately after an upload is accepted."""

    doc_id: UUID
    status: DocumentStatus
    filename: str


class DocumentItem(BaseModel):
    """Serialized metadata for an uploaded document."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    file_type: DocumentType
    status: DocumentStatus
    chunk_count: int
    pinecone_namespace: str
    uploaded_at: datetime
    indexed_at: datetime | None


class DocumentListResponse(BaseModel):
    """Collection wrapper for document metadata."""

    documents: list[DocumentItem]


class Citation(BaseModel):
    """Citation attached to chatbot answers and reports."""

    source: str
    section_ref: str
    snippet: str
    score: float = 0.0


class ChatMessage(BaseModel):
    """Single chat message with optional citation metadata."""

    role: Literal["user", "assistant", "system"]
    content: str
    citations: list[Citation] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    """Chat request payload for AI assistant queries."""

    query: str = Field(min_length=2, max_length=4000)
    session_id: str = Field(min_length=3, max_length=128)


class ChatResponse(BaseModel):
    """Completed chat response payload."""

    answer: str
    citations: list[Citation]
    query_type: str
    session_id: str


class DeadlineItem(BaseModel):
    """Upcoming compliance deadline details."""

    filing_name: str
    due_date: datetime
    days_remaining: int
    urgency: Literal["RED", "AMBER", "GREEN"]
    status: str
    section_ref: str | None = None


class ComplianceAlert(BaseModel):
    """Dashboard alert highlighting overdue or risky compliance issues."""

    title: str
    severity: Literal["low", "medium", "high"]
    description: str
    due_date: datetime | None = None


class DashboardMetrics(BaseModel):
    """Aggregate KPI payload for the dashboard home screen."""

    compliance_score: int
    pending_filings: int
    tds_liability: float
    documents_indexed: int
    deadlines_this_month: int
    last_updated: datetime


class ReportResponse(BaseModel):
    """Generated report payload including identifier and markdown content."""

    report_id: str
    content: str
    generated_at: datetime


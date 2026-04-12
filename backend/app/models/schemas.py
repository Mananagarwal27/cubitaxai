"""Pydantic request and response schemas for API contracts."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.document import DocumentStatus, DocumentType
from app.models.user import UserRole


# ── Auth ──────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """Registration payload for a new user account."""

    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    company_name: str = Field(min_length=2, max_length=255)
    pan_number: Optional[str] = Field(default=None)
    gstin: Optional[str] = Field(default=None)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = Field(default=UserRole.ANALYST)

    @field_validator("pan_number")
    @classmethod
    def validate_pan(cls, value: Optional[str]) -> str | None:
        """Validate PAN format when provided."""
        if value and len(value) == 10 and value[:5].isalpha() and value[5:9].isdigit() and value[9].isalpha():
            return value.upper()
        if value:
            raise ValueError("PAN number must match ABCDE1234F format")
        return value

    @field_validator("gstin")
    @classmethod
    def validate_gstin(cls, value: Optional[str]) -> str | None:
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
    pan_number: Optional[str]
    gstin: Optional[str]
    is_active: bool
    role: UserRole
    organization_id: Optional[UUID] = None
    financial_year: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class Token(BaseModel):
    """JWT bearer token payload."""

    access_token: str
    token_type: Literal["bearer"] = "bearer"


class TokenData(BaseModel):
    """Decoded token claims required for user lookup."""

    sub: Optional[str] = None
    email: EmailStr | None = None
    role: Optional[str] = None
    org_id: Optional[str] = None


class AuthResponse(Token):
    """Authentication response containing access + refresh tokens and user."""

    refresh_token: str = ""
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Request to rotate a refresh token."""

    refresh_token: str


class RefreshTokenResponse(BaseModel):
    """New access + refresh token pair."""

    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"


# ── Organization & API Keys ──────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    """Payload for creating a new organization."""

    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=100, pattern=r"^[a-z0-9\-]+$")


class OrganizationResponse(BaseModel):
    """Serialized organization details."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    pinecone_namespace: str
    is_active: bool
    max_users: int
    max_documents: int
    created_at: datetime


class APIKeyCreate(BaseModel):
    """Payload for generating a new API key."""

    name: str = Field(min_length=2, max_length=100)


class APIKeyResponse(BaseModel):
    """API key metadata (does NOT include the raw key after creation)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    key_prefix: str
    is_active: bool
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime


class APIKeyCreatedResponse(APIKeyResponse):
    """Response when an API key is first created — includes the raw key."""

    raw_key: str


class TeamMemberInvite(BaseModel):
    """Invite a user to an organization."""

    email: EmailStr
    role: UserRole = Field(default=UserRole.ANALYST)


# ── Documents ────────────────────────────────────────────────────────────

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
    financial_year: Optional[str] = None
    version: int = 1
    content_hash: Optional[str] = None
    uploaded_at: datetime
    indexed_at: Optional[datetime]
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None


class DocumentListResponse(BaseModel):
    """Collection wrapper for document metadata."""

    documents: list[DocumentItem]


# ── Chat ─────────────────────────────────────────────────────────────────

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
    agent: Optional[str] = None
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
    agent: Optional[str] = None
    needs_review: bool = False
    plan: Optional[dict[str, Any]] = None
    critique_scores: Optional[dict[str, float]] = None


# ── Dashboard ────────────────────────────────────────────────────────────

class DeadlineItem(BaseModel):
    """Upcoming compliance deadline details."""

    filing_name: str
    due_date: datetime
    days_remaining: int
    urgency: Literal["RED", "AMBER", "GREEN"]
    status: str
    section_ref: Optional[str] = None


class ComplianceAlert(BaseModel):
    """Dashboard alert highlighting overdue or risky compliance issues."""

    title: str
    severity: Literal["low", "medium", "high"]
    description: str
    due_date: Optional[datetime] = None


class DashboardMetrics(BaseModel):
    """Aggregate KPI payload for the dashboard home screen."""

    compliance_score: int
    pending_filings: int
    tds_liability: float
    gst_payable: float = 0.0
    advance_tax_due: float = 0.0
    documents_indexed: int
    deadlines_this_month: int
    last_updated: datetime


class FilingStatusItem(BaseModel):
    """Individual filing obligation status row."""

    filing_type: str
    period: str
    due_date: datetime
    status: Literal["Filed", "Pending", "Overdue", "Not Applicable"]
    amount: float = 0.0


# ── Reports ──────────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    """Request payload for generating a compliance report."""

    report_type: Literal["compliance", "tds_summary", "gst_summary", "full_audit"] = "compliance"
    financial_year: str = "FY2025"
    format: Literal["pdf", "docx"] = "pdf"


class ReportResponse(BaseModel):
    """Generated report payload including identifier and markdown content."""

    report_id: str
    content: str
    report_type: str = "compliance"
    generated_at: datetime
    citations: list[Citation] = Field(default_factory=list)
    confidence_score: float = 1.0


class ReportListItem(BaseModel):
    """Report list entry for the reports page."""

    report_id: str
    report_type: str
    generated_at: datetime
    filename: str


# ── Health ───────────────────────────────────────────────────────────────

class ComponentHealth(BaseModel):
    """Health status of an individual infrastructure component."""

    name: str
    status: Literal["healthy", "degraded", "down"]
    latency_ms: Optional[float] = None
    message: Optional[str] = None


class HealthResponse(BaseModel):
    """Full system health check response."""

    name: str
    version: str
    status: Literal["healthy", "degraded", "down"]
    components: list[ComponentHealth]


# ── A/B Testing & Experiments ────────────────────────────────────────────

class ExperimentFlag(BaseModel):
    """Feature flag for retrieval strategy experiments."""

    name: str
    variant: str
    is_active: bool = True

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Boolean, Text, Integer
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid
import enum
from datetime import datetime
from app.database import Base

class AnnotationTypeEnum(str, enum.Enum):
    COMMENT = "COMMENT"
    CORRECTION = "CORRECTION"
    APPROVAL_NOTE = "APPROVAL_NOTE"
    FLAG = "FLAG"

class ApprovalStatusEnum(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REVISION_REQUESTED = "REVISION_REQUESTED"

class ReportAnnotation(Base):
    __tablename__ = "report_annotations"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Note: Assuming 'reports' table exists. Leaving ForeignKey out if unsure, but prompt implies it:
    report_id = Column(PGUUID(as_uuid=True)) # no FK to avoid failure if reports table is not named 'reports'
    org_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id"))
    author_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"))
    content = Column(Text)
    highlighted_text = Column(Text, nullable=True)
    page_number = Column(Integer, nullable=True)
    annotation_type = Column(Enum(AnnotationTypeEnum))
    resolved = Column(Boolean, default=False)
    resolved_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ReportApproval(Base):
    __tablename__ = "report_approvals"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(PGUUID(as_uuid=True))
    org_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id"))
    requested_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"))
    approved_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(Enum(ApprovalStatusEnum), default=ApprovalStatusEnum.PENDING_REVIEW)
    review_notes = Column(Text, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    client_shared_at = Column(DateTime, nullable=True)

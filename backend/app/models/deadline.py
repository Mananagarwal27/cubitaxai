from sqlalchemy import Column, String, DateTime, Enum, DECIMAL, Date, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid
import enum
from datetime import datetime

from app.database import Base

class FilingType(str, enum.Enum):
    ITR = "ITR"
    GST_3B = "GST_3B"
    GST_1 = "GST_1"
    TDS_24Q = "TDS_24Q"
    TDS_26Q = "TDS_26Q"
    ADVANCE_TAX = "ADVANCE_TAX"
    PT = "PT"
    ESI = "ESI"
    PF = "PF"

class FilingStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    FILED = "FILED"
    OVERDUE = "OVERDUE"
    WAIVED = "WAIVED"

class AlertChannel(str, enum.Enum):
    EMAIL = "EMAIL"
    WEBHOOK = "WEBHOOK"

class AlertStatus(str, enum.Enum):
    SENT = "SENT"
    FAILED = "FAILED"

class DeadlineCalendar(Base):
    __tablename__ = "deadline_calendar"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id"))
    filing_type = Column(Enum(FilingType))
    period = Column(String)
    due_date = Column(Date)
    amount_due = Column(DECIMAL(15,2), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class FilingStatus(Base):
    __tablename__ = "filing_status"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id"))
    deadline_id = Column(PGUUID(as_uuid=True), ForeignKey("deadline_calendar.id"), unique=True)
    status = Column(Enum(FilingStatusEnum), default=FilingStatusEnum.PENDING)
    filed_at = Column(DateTime, nullable=True)
    filed_by = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    ack_number = Column(String(50), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AlertLog(Base):
    __tablename__ = "alert_log"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id"))
    alert_key = Column(String, unique=True)
    channel = Column(Enum(AlertChannel))
    sent_at = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(AlertStatus))
    error_msg = Column(Text, nullable=True)

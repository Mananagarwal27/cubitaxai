from sqlalchemy import Column, String, DateTime, Enum, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
import uuid
import enum
from datetime import datetime
from app.database import Base

class ActionEnum(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    READ = "READ"

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(PGUUID(as_uuid=True), nullable=True) # Sometimes actions are system-wide
    user_id = Column(PGUUID(as_uuid=True), nullable=True)
    action = Column(Enum(ActionEnum))
    entity_name = Column(String)
    entity_id = Column(String)
    changes = Column(JSONB, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

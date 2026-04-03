from sqlalchemy import Column, String, DateTime, Enum, DECIMAL, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.dialects.postgresql import JSONB
import uuid
import enum
from datetime import datetime
from app.database import Base

class ProviderEnum(str, enum.Enum):
    TRACES = "TRACES"
    GST_PORTAL = "GST_PORTAL"
    ZOHO_BOOKS = "ZOHO_BOOKS"

class OAuthToken(Base):
    __tablename__ = "oauth_tokens"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id"))
    provider = Column(Enum(ProviderEnum))
    access_token = Column(Text)
    refresh_token = Column(Text)
    expires_at = Column(DateTime)
    scope = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AISData(Base):
    __tablename__ = "ais_data"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id"))
    financial_year = Column(String)
    pan = Column(String)
    salary_income = Column(DECIMAL(15,2), nullable=True)
    interest_income = Column(DECIMAL(15,2), nullable=True)
    dividend_income = Column(DECIMAL(15,2), nullable=True)
    property_sale = Column(DECIMAL(15,2), nullable=True)
    securities_sale = Column(DECIMAL(15,2), nullable=True)
    tds_deducted = Column(DECIMAL(15,2), nullable=True)
    raw_json = Column(JSONB)
    fetched_at = Column(DateTime, default=datetime.utcnow)

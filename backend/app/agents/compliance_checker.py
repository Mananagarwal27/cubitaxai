"""Compliance analysis agent for deadlines, filing checks, and scoring."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select

from app.database import AsyncSessionLocal
from app.models.document import Document, DocumentStatus, DocumentType
from app.models.schemas import ComplianceAlert, DeadlineItem
from app.models.user import User
from app.services.deadline_service import DeadlineService
from app.services.tax_rules_engine import TaxRulesEngine


class ComplianceCheckerAgent:
    """Generate deadline insights, filing checks, and compliance metrics."""

    def __init__(self) -> None:
        """Initialize reusable compliance services."""

        self.deadline_service = DeadlineService()
        self.tax_rules = TaxRulesEngine()

    async def get_upcoming_deadlines(self, user_id: str) -> list[DeadlineItem]:
        """Return upcoming compliance deadlines relevant to the user."""

        _ = user_id
        deadlines = [deadline for deadline in self.deadline_service.get_current_deadlines() if deadline.days_remaining >= -30]
        return deadlines[:10]

    async def check_filing_status(self, user_id: str) -> dict[str, str]:
        """Compare expected filing artifacts against uploaded documents."""

        async with AsyncSessionLocal() as session:
            user_uuid = uuid.UUID(user_id)
            result = await session.execute(
                select(Document.file_type, func.count(Document.id))
                .where(Document.user_id == user_uuid, Document.status == DocumentStatus.INDEXED)
                .group_by(Document.file_type)
            )
            counts = {file_type.value: count for file_type, count in result.all()}

        return {
            "ITR": "Available" if counts.get(DocumentType.ITR.value) else "Pending",
            "GSTR": "Available" if counts.get(DocumentType.GSTR.value) else "Pending",
            "TDS_CERT": "Available" if counts.get(DocumentType.TDS_CERT.value) else "Pending",
            "FORM_26AS": "Available" if counts.get(DocumentType.FORM_26AS.value) else "Pending",
        }

    async def generate_compliance_score(self, user_id: str) -> int:
        """Compute a weighted compliance score between 0 and 100."""

        deadlines = await self.get_upcoming_deadlines(user_id)
        filing_status = await self.check_filing_status(user_id)
        async with AsyncSessionLocal() as session:
            user_uuid = uuid.UUID(user_id)
            document_count = await session.scalar(
                select(func.count(Document.id)).where(
                    Document.user_id == user_uuid,
                    Document.status == DocumentStatus.INDEXED,
                )
            )

        overdue_penalty = sum(10 for deadline in deadlines if deadline.days_remaining < 0)
        pending_penalty = sum(8 for status in filing_status.values() if status == "Pending")
        document_bonus = min(int((document_count or 0) * 5), 20)
        score = 100 - overdue_penalty - pending_penalty + document_bonus
        return max(min(score, 100), 0)

    async def get_alerts(self, user_id: str) -> list[ComplianceAlert]:
        """Build actionable compliance alerts for dashboard display."""

        filing_status = await self.check_filing_status(user_id)
        deadlines = await self.get_upcoming_deadlines(user_id)
        alerts: list[ComplianceAlert] = []

        for filing_name, status in filing_status.items():
            if status == "Pending":
                alerts.append(
                    ComplianceAlert(
                        title=f"{filing_name} document missing",
                        severity="medium",
                        description=f"Upload the latest {filing_name} record to improve answer quality and compliance tracking.",
                    )
                )
        for deadline in deadlines:
            if deadline.days_remaining < 0:
                alerts.append(
                    ComplianceAlert(
                        title=f"{deadline.filing_name} overdue",
                        severity="high",
                        description=f"{deadline.filing_name} is overdue. Review the filing position immediately.",
                        due_date=deadline.due_date,
                    )
                )
            elif deadline.days_remaining < 7:
                alerts.append(
                    ComplianceAlert(
                        title=f"{deadline.filing_name} due soon",
                        severity="high",
                        description=f"{deadline.filing_name} is due within 7 days.",
                        due_date=deadline.due_date,
                    )
                )
        return alerts[:8]

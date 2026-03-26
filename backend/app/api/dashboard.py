"""Dashboard metrics, deadlines, and alert routes."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.compliance_checker import ComplianceCheckerAgent
from app.database import get_db
from app.models.document import Document, DocumentStatus
from app.models.schemas import ComplianceAlert, DashboardMetrics, DeadlineItem
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.tax_rules_engine import TaxRulesEngine

router = APIRouter()


@router.get("/metrics", response_model=DashboardMetrics)
async def get_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardMetrics:
    """Return dashboard KPI metrics for the current user."""

    checker = ComplianceCheckerAgent()
    tax_rules = TaxRulesEngine()
    score = await checker.generate_compliance_score(str(current_user.id))
    filing_status = await checker.check_filing_status(str(current_user.id))
    deadlines = await checker.get_upcoming_deadlines(str(current_user.id))
    indexed_count = await db.scalar(
        select(func.count(Document.id)).where(
            Document.user_id == current_user.id,
            Document.status == DocumentStatus.INDEXED,
        )
    )
    return DashboardMetrics(
        compliance_score=score,
        pending_filings=sum(1 for status in filing_status.values() if status == "Pending"),
        tds_liability=tax_rules.estimate_tds_liability(indexed_count or 0),
        documents_indexed=indexed_count or 0,
        deadlines_this_month=sum(
            1
            for deadline in deadlines
            if deadline.due_date.month == datetime.now(timezone.utc).month and deadline.days_remaining >= 0
        ),
        last_updated=datetime.now(timezone.utc),
    )


@router.get("/deadlines", response_model=list[DeadlineItem])
async def get_deadlines(current_user: User = Depends(get_current_user)) -> list[DeadlineItem]:
    """Return upcoming deadlines ordered by due date."""

    checker = ComplianceCheckerAgent()
    deadlines = await checker.get_upcoming_deadlines(str(current_user.id))
    return sorted(deadlines, key=lambda item: item.due_date)


@router.get("/alerts", response_model=list[ComplianceAlert])
async def get_alerts(current_user: User = Depends(get_current_user)) -> list[ComplianceAlert]:
    """Return compliance alerts for the current user."""

    checker = ComplianceCheckerAgent()
    return await checker.get_alerts(str(current_user.id))


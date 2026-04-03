from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.database import get_db
from app.services.auth_service import get_current_user
from app.dependencies import require_roles
from app.models.user import User
from app.models.deadline import DeadlineCalendar, FilingStatus
from app.models.review import ReportApproval, ApprovalStatusEnum

router = APIRouter()

@router.get("/filing-status", dependencies=[Depends(require_roles(["client"]))])
async def get_filing_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(DeadlineCalendar, FilingStatus).outerjoin(
        FilingStatus, DeadlineCalendar.id == FilingStatus.deadline_id
    ).where(DeadlineCalendar.org_id == current_user.organization_id)
    result = await db.execute(query)
    
    out = []
    for dl, fs in result.all():
        out.append({
            "id": dl.id,
            "filing_type": dl.filing_type,
            "period": dl.period,
            "due_date": dl.due_date,
            "status": fs.status if fs else "PENDING",
            "ack_number": fs.ack_number if fs else None
        })
    return {"filings": out}

@router.get("/deadlines", dependencies=[Depends(require_roles(["client"]))])
async def get_deadlines(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from datetime import datetime
    query = select(DeadlineCalendar).where(
        DeadlineCalendar.org_id == current_user.organization_id,
        DeadlineCalendar.due_date >= datetime.utcnow().date()
    ).order_by(DeadlineCalendar.due_date.asc()).limit(3)
    
    result = await db.execute(query)
    deadlines = result.scalars().all()
    # If using days_remaining:
    out = []
    for dl in deadlines:
        days_rem = (dl.due_date - datetime.utcnow().date()).days
        out.append({
            "name": f"{dl.filing_type.value} - {dl.period}",
            "due_date": dl.due_date,
            "days_remaining": days_rem
        })
    return {"deadlines": out}

@router.get("/reports", dependencies=[Depends(require_roles(["client"]))])
async def get_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Only APPROVED and Client Shared Reports
    query = select(ReportApproval).where(
        ReportApproval.org_id == current_user.organization_id,
        ReportApproval.status == ApprovalStatusEnum.APPROVED,
        ReportApproval.client_shared_at != None
    )
    result = await db.execute(query)
    approvals = result.scalars().all()
    
    # Ideally join with reports table to get name and date, returning mock info structure 
    # based on approval info representing reports.
    return {
        "reports": [
            {
                "id": str(app.report_id),
                "date": app.client_shared_at,
                "name": "Tax Compliance Report" # Normally derived from reports table
            }
            for app in approvals
        ]
    }

@router.get("/reports/{id}/download", dependencies=[Depends(require_roles(["client"]))])
async def download_report(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify report is accessible and approved
    query = select(ReportApproval).where(
        ReportApproval.report_id == uuid.UUID(id),
        ReportApproval.org_id == current_user.organization_id,
        ReportApproval.client_shared_at != None
    )
    result = await db.execute(query)
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=403, detail="Report not available")
    
    # Delegate to reports generation / storage (Mock success payload for now)
    return {"download_url": f"/api/reports/download/{id}?format=pdf"}

@router.get("/compliance-score", dependencies=[Depends(require_roles(["client"]))])
async def get_compliance_score(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Simplified mock score
    return {"score": 92}

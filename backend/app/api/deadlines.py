from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
import uuid

from app.database import get_db
from app.services.auth_service import get_current_user
from app.dependencies import require_roles
from app.models.deadline import DeadlineCalendar, FilingStatus, AlertLog, FilingType, FilingStatusEnum
from app.models.user import User

router = APIRouter()

class DeadlineCreate(BaseModel):
    filing_type: FilingType
    period: str
    due_date: date
    amount_due: Optional[float] = None
    notes: Optional[str] = None

class MarkFiledRequest(BaseModel):
    ack_number: str

@router.get("/")
async def list_deadlines(
    status: Optional[FilingStatusEnum] = None,
    filing_type: Optional[FilingType] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(DeadlineCalendar, FilingStatus).outerjoin(
        FilingStatus, DeadlineCalendar.id == FilingStatus.deadline_id
    ).where(DeadlineCalendar.org_id == current_user.organization_id)
    
    if filing_type:
        query = query.where(DeadlineCalendar.filing_type == filing_type)
        
    result = await db.execute(query)
    
    out = []
    for dl, fs in result.all():
        if status and (not fs or fs.status != status):
            continue
        out.append({
            "id": dl.id,
            "filing_type": dl.filing_type,
            "period": dl.period,
            "due_date": dl.due_date,
            "amount_due": dl.amount_due,
            "status": fs.status if fs else "PENDING"
        })
    return out

@router.post("/", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def create_deadline(
    req: DeadlineCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    dl = DeadlineCalendar(
        org_id=current_user.organization_id,
        filing_type=req.filing_type,
        period=req.period,
        due_date=req.due_date,
        amount_due=req.amount_due,
        notes=req.notes
    )
    db.add(dl)
    await db.commit()
    await db.refresh(dl)
    return dl

@router.put("/{id}", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def update_deadline(
    id: uuid.UUID,
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(DeadlineCalendar).where(DeadlineCalendar.id == id, DeadlineCalendar.org_id == current_user.organization_id))
    dl = result.scalar_one_or_none()
    if not dl:
        raise HTTPException(status_code=404, detail="Not found")
    
    if "amount_due" in req:
        dl.amount_due = req["amount_due"]
    if "notes" in req:
        dl.notes = req["notes"]
    await db.commit()
    return dl

@router.post("/{id}/mark-filed", dependencies=[Depends(require_roles(["admin", "ca_firm", "cfo"]))])
async def mark_filed(
    id: uuid.UUID,
    req: MarkFiledRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(FilingStatus).where(FilingStatus.deadline_id == id))
    fs = result.scalar_one_or_none()
    if not fs:
        fs = FilingStatus(org_id=current_user.organization_id, deadline_id=id)
        db.add(fs)
    fs.status = FilingStatusEnum.FILED
    fs.ack_number = req.ack_number
    fs.filed_by = current_user.id
    import datetime
    fs.filed_at = datetime.datetime.utcnow()
    await db.commit()
    return fs

@router.get("/alerts/history", dependencies=[Depends(require_roles(["admin"]))])
async def get_alert_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AlertLog).where(AlertLog.org_id == current_user.organization_id))
    return result.scalars().all()

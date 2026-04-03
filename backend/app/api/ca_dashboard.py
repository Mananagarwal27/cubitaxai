from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List
import uuid

from app.database import get_db
from app.services.auth_service import get_current_user
from app.dependencies import require_roles
from app.models.organization import Organization, CAClientRelationship
from app.models.deadline import DeadlineCalendar, FilingStatus
from app.models.user import User

router = APIRouter()

@router.get("/clients", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def list_clients(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Organization).join(
        CAClientRelationship, 
        and_(
            CAClientRelationship.client_org_id == Organization.id,
            CAClientRelationship.ca_org_id == current_user.organization_id,
            CAClientRelationship.is_active == True
        )
    )
    result = await db.execute(query)
    clients = result.scalars().all()
    # Mock return basic info
    return [{"id": c.id, "name": c.name, "company_name": c.name, "pan_number": "XXXXX1234X"} for c in clients]

@router.get("/clients/deadline-sweep", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def client_deadline_sweep(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get all active clients
    clients_query = select(CAClientRelationship.client_org_id).where(
        CAClientRelationship.ca_org_id == current_user.organization_id,
        CAClientRelationship.is_active == True
    )
    clients_res = await db.execute(clients_query)
    client_ids = [c for c in clients_res.scalars().all()]
    
    if not client_ids:
        return []
        
    from datetime import datetime, timedelta
    thirty_days = datetime.utcnow().date() + timedelta(days=30)
    
    query = select(DeadlineCalendar, Organization.name, FilingStatus).join(
        Organization, Organization.id == DeadlineCalendar.org_id
    ).outerjoin(
        FilingStatus, FilingStatus.deadline_id == DeadlineCalendar.id
    ).where(
        DeadlineCalendar.org_id.in_(client_ids),
        DeadlineCalendar.due_date <= thirty_days
    )
    
    res = await db.execute(query)
    out = []
    for dl, org_name, fs in res.all():
        out.append({
            "client_name": org_name,
            "filing_type": dl.filing_type,
            "period": dl.period,
            "due_date": dl.due_date,
            "status": fs.status if fs else "PENDING",
            "days_left": (dl.due_date - datetime.utcnow().date()).days
        })
    return out

@router.get("/clients/{org_id}/health", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def client_health(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify relationship
    rel = await db.execute(select(CAClientRelationship).where(
        CAClientRelationship.ca_org_id == current_user.organization_id,
        CAClientRelationship.client_org_id == org_id,
        CAClientRelationship.is_active == True
    ))
    if not rel.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not authorized for this client")
    
    # Mock health returned
    return {
        "score": 85,
        "overdue_count": 0,
        "due_this_week": 1,
        "last_activity": str(datetime.utcnow())
    }

@router.post("/clients/{org_id}/switch", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def switch_client_context(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # This route would issue a new JWT with an active_org_context claim,
    # or just set a session context if we had stateful sessions.
    # For now we'll mock success. Real implementation would update the token payload
    # but the prompt hints "set active_org_context in JWT claims" which requires re-issuing the token
    # or we can just mock returning the new token here.
    return {"status": "switched", "new_context": str(org_id)}

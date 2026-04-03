from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
import uuid
import datetime

from app.database import get_db
from app.services.auth_service import get_current_user
from app.dependencies import require_roles
from app.models.review import ReportAnnotation, ReportApproval, AnnotationTypeEnum, ApprovalStatusEnum
from app.models.user import User

router = APIRouter()

class AnnotationCreate(BaseModel):
    content: str
    highlighted_text: Optional[str] = None
    page_number: Optional[int] = None
    annotation_type: AnnotationTypeEnum

@router.post("/{report_id}/annotations", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def add_annotation(
    report_id: uuid.UUID,
    req: AnnotationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ann = ReportAnnotation(
        report_id=report_id,
        org_id=current_user.organization_id,
        author_id=current_user.id,
        content=req.content,
        highlighted_text=req.highlighted_text,
        page_number=req.page_number,
        annotation_type=req.annotation_type
    )
    db.add(ann)
    await db.commit()
    await db.refresh(ann)
    return ann

@router.get("/{report_id}/annotations", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def list_annotations(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ReportAnnotation).where(ReportAnnotation.report_id == report_id))
    return result.scalars().all()

@router.put("/{report_id}/annotations/{ann_id}", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def edit_annotation(
    report_id: uuid.UUID,
    ann_id: uuid.UUID,
    req: dict,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ReportAnnotation).where(ReportAnnotation.id == ann_id, ReportAnnotation.report_id == report_id))
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404, detail="Not found")
    if "content" in req:
        ann.content = req["content"]
    await db.commit()
    return ann

@router.post("/{report_id}/annotations/{ann_id}/resolve", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def resolve_annotation(
    report_id: uuid.UUID,
    ann_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ReportAnnotation).where(ReportAnnotation.id == ann_id, ReportAnnotation.report_id == report_id))
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404, detail="Not found")
    ann.resolved = True
    ann.resolved_by = current_user.id
    ann.resolved_at = datetime.datetime.utcnow()
    await db.commit()
    return {"status": "resolved"}

@router.post("/{report_id}/request-approval", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def request_approval(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    app = ReportApproval(
        report_id=report_id,
        org_id=current_user.organization_id,
        requested_by=current_user.id,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app

class ApprovalUpdate(BaseModel):
    status: ApprovalStatusEnum
    review_notes: Optional[str] = None

@router.put("/{report_id}/approval", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def update_approval(
    report_id: uuid.UUID,
    req: ApprovalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ReportApproval).where(ReportApproval.report_id == report_id).order_by(ReportApproval.requested_at.desc()))
    app = result.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Approval request not found")
    app.status = req.status
    app.review_notes = req.review_notes
    app.approved_by = current_user.id
    app.reviewed_at = datetime.datetime.utcnow()
    await db.commit()
    return app

@router.post("/{report_id}/share-with-client", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def share_with_client(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ReportApproval).where(ReportApproval.report_id == report_id).order_by(ReportApproval.requested_at.desc()))
    app = result.scalars().first()
    if not app or app.status != ApprovalStatusEnum.APPROVED:
        raise HTTPException(status_code=400, detail="Only approved reports can be shared")
    app.client_shared_at = datetime.datetime.utcnow()
    await db.commit()
    return {"status": "shared"}

@router.get("/{report_id}/audit-trail", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def audit_trail(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    anns = await db.execute(select(ReportAnnotation).where(ReportAnnotation.report_id == report_id))
    apps = await db.execute(select(ReportApproval).where(ReportApproval.report_id == report_id))
    return {
        "annotations": anns.scalars().all(),
        "approvals": apps.scalars().all()
    }

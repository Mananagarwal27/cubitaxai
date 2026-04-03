from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict
import uuid
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.services.auth_service import get_current_user
from app.dependencies import require_roles
from app.models.user import User
from app.models.integrations import OAuthToken, ProviderEnum, AISData
from app.services.traces_connector import TRACESConnector

router = APIRouter()
traces = TRACESConnector()

@router.get("/traces/connect", dependencies=[Depends(require_roles(["admin"]))])
async def get_traces_oauth_url(
    redirect_uri: str,
    current_user: User = Depends(get_current_user)
):
    url = await traces.get_oauth_url(current_user.organization_id, redirect_uri)
    return {"url": url}

@router.get("/traces/callback")
async def traces_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db)
):
    org_id = uuid.UUID(state)
    tokens = await traces.exchange_code(code, org_id)
    token = OAuthToken(
        org_id=org_id,
        provider=ProviderEnum.TRACES,
        access_token=tokens["access_token"], # Should encrypt in real 
        refresh_token=tokens["refresh_token"],
        expires_at=datetime.utcnow(),
        scope=tokens["scope"]
    )
    db.add(token)
    await db.commit()
    return {"status": "success"}

class FetchRequest(BaseModel):
    financial_year: str
    document_types: List[str]

@router.post("/traces/fetch", dependencies=[Depends(require_roles(["admin", "ca_firm"]))])
async def trigger_traces_fetch(
    req: FetchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if "ais" in req.document_types:
        ais = await traces.fetch_ais(current_user.organization_id, req.financial_year)
        record = AISData(
            org_id=current_user.organization_id,
            financial_year=req.financial_year,
            pan=ais.get("pan"),
            salary_income=ais.get("salary"),
            interest_income=ais.get("interest"),
            tds_deducted=ais.get("tds"),
            raw_json=ais
        )
        db.add(record)
        await db.commit()
    return {"status": "fetch triggered successfully"}

@router.get("/traces/status")
async def get_traces_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(OAuthToken).where(
        OAuthToken.org_id == current_user.organization_id,
        OAuthToken.provider == ProviderEnum.TRACES
    ))
    token = res.scalars().first()
    if token:
        # Get latest fetched data
        ais_res = await db.execute(select(AISData).where(
            AISData.org_id == current_user.organization_id
        ).order_by(AISData.fetched_at.desc()))
        ais = ais_res.scalars().first()
        return {
            "status": "connected",
            "last_sync": ais.fetched_at if ais else None,
            "pan": ais.pan if ais else None,
            "ais": ais.raw_json if ais else None
        }
    return {"status": "disconnected"}

@router.delete("/traces/disconnect", dependencies=[Depends(require_roles(["admin"]))])
async def revoke_traces_tokens(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(OAuthToken).where(
        OAuthToken.org_id == current_user.organization_id,
        OAuthToken.provider == ProviderEnum.TRACES
    ))
    for t in res.scalars().all():
        await db.delete(t)
    await db.commit()
    return {"status": "disconnected"}

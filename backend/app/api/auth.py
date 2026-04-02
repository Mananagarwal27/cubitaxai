"""Authentication API routes for registration, login, token refresh, and API keys."""

from __future__ import annotations

import hashlib
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.organization import APIKey
from app.models.schemas import (
    APIKeyCreate,
    APIKeyCreatedResponse,
    APIKeyResponse,
    AuthResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.models.user import User
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_password_hash,
    hash_token,
    rotate_refresh_token,
    verify_password,
)

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Register a new user and return access + refresh tokens."""

    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        company_name=payload.company_name,
        pan_number=payload.pan_number,
        gstin=payload.gstin,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "org_id": str(user.organization_id) if user.organization_id else None,
    })
    refresh_token = create_refresh_token(str(user.id))
    user.refresh_token_hash = hash_token(refresh_token)
    await db.commit()

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login_user(payload: UserLogin, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """Authenticate a user with email and password."""

    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
            "org_id": str(user.organization_id) if user.organization_id else None,
        },
        expires_delta=timedelta(hours=24),
    )
    refresh_token = create_refresh_token(str(user.id))
    user.refresh_token_hash = hash_token(refresh_token)
    await db.commit()

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_access_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> RefreshTokenResponse:
    """Exchange a valid refresh token for a new access + refresh token pair."""

    new_access, new_refresh, _ = await rotate_refresh_token(payload.refresh_token, db)
    return RefreshTokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return the authenticated user's profile."""

    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    full_name: str | None = None,
    pan_number: str | None = None,
    financial_year: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update fields on the current user's profile."""

    if full_name:
        current_user.full_name = full_name
    if pan_number:
        current_user.pan_number = pan_number
    if financial_year:
        current_user.financial_year = financial_year
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


# ── API Key Management ───────────────────────────────────────────────────

@router.post("/api-keys", response_model=APIKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> APIKeyCreatedResponse:
    """Generate a new programmatic API key for the user's organization."""

    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization to create API keys",
        )

    raw_key, prefix = APIKey.generate_key()
    api_key = APIKey(
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        name=payload.name,
        key_prefix=prefix,
        key_hash=hashlib.sha256(raw_key.encode()).hexdigest(),
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    response = APIKeyCreatedResponse.model_validate(api_key)
    response.raw_key = raw_key
    return response


@router.get("/api-keys", response_model=list[APIKeyResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[APIKeyResponse]:
    """List all API keys for the user's organization."""

    if not current_user.organization_id:
        return []

    result = await db.execute(
        select(APIKey).where(
            APIKey.organization_id == current_user.organization_id,
            APIKey.is_active == True,
        )
    )
    return [APIKeyResponse.model_validate(key) for key in result.scalars().all()]


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Revoke (deactivate) an API key."""

    from uuid import UUID

    result = await db.execute(
        select(APIKey).where(
            APIKey.id == UUID(key_id),
            APIKey.organization_id == current_user.organization_id,
        )
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
    api_key.is_active = False
    await db.commit()

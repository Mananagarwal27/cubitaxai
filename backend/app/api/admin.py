"""Admin API routes for organization and team management."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.organization import Organization
from app.models.schemas import (
    OrganizationCreate,
    OrganizationResponse,
    TeamMemberInvite,
    UserResponse,
)
from app.models.user import User, UserRole
from app.services.auth_service import get_password_hash, require_roles

router = APIRouter()


# ── Organization CRUD ────────────────────────────────────────────────────

@router.post("/organizations", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    payload: OrganizationCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> OrganizationResponse:
    """Create a new organization (admin only)."""

    existing = await db.execute(select(Organization).where(Organization.slug == payload.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Organization slug already taken")

    org = Organization(
        name=payload.name,
        slug=payload.slug,
        pinecone_namespace=f"org_{payload.slug}",
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)

    if not current_user.organization_id:
        current_user.organization_id = org.id
        await db.commit()

    return OrganizationResponse.model_validate(org)


@router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.CA_FIRM)),
    db: AsyncSession = Depends(get_db),
) -> OrganizationResponse:
    """Get organization details."""

    result = await db.execute(select(Organization).where(Organization.id == UUID(org_id)))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return OrganizationResponse.model_validate(org)


# ── Team Management ──────────────────────────────────────────────────────

@router.get("/team", response_model=list[UserResponse])
async def list_team_members(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.CA_FIRM)),
    db: AsyncSession = Depends(get_db),
) -> list[UserResponse]:
    """List all members of the current user's organization."""

    if not current_user.organization_id:
        return []

    result = await db.execute(
        select(User).where(User.organization_id == current_user.organization_id)
    )
    return [UserResponse.model_validate(user) for user in result.scalars().all()]


@router.post("/team/invite", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def invite_team_member(
    payload: TeamMemberInvite,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Invite a new member to the organization. Creates account with temporary password."""

    if not current_user.organization_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You must belong to an organization")

    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    org_result = await db.execute(
        select(Organization).where(Organization.id == current_user.organization_id)
    )
    org = org_result.scalar_one()

    member_count = await db.scalar(
        select(func.count(User.id)).where(User.organization_id == org.id)
    )
    if (member_count or 0) >= org.max_users:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Organization has reached its member limit ({org.max_users})",
        )

    import secrets
    temp_password = secrets.token_urlsafe(12)

    user = User(
        email=payload.email,
        full_name=payload.email.split("@")[0].title(),
        company_name=org.name,
        hashed_password=get_password_hash(temp_password),
        role=payload.role,
        organization_id=org.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.put("/team/{user_id}/role", response_model=UserResponse)
async def change_member_role(
    user_id: str,
    role: UserRole,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Change a team member's role (admin only)."""

    result = await db.execute(
        select(User).where(
            User.id == UUID(user_id),
            User.organization_id == current_user.organization_id,
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")

    user.role = role
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete("/team/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    user_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove a member from the organization (admin only)."""

    if str(current_user.id) == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove yourself")

    result = await db.execute(
        select(User).where(
            User.id == UUID(user_id),
            User.organization_id == current_user.organization_id,
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found")

    user.organization_id = None
    user.is_active = False
    await db.commit()

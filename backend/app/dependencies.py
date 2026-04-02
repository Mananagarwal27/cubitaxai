"""Reusable FastAPI dependencies for authenticated and authorized routes."""

from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import get_current_user, get_current_user_or_api_key, require_roles


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Return the authenticated user and keep database dependency explicit."""
    _ = db
    return current_user


def get_org_namespace(current_user: User = Depends(get_current_user)) -> str:
    """Resolve the isolated Pinecone namespace for the user's organization."""
    if current_user.organization_id:
        return f"org_{current_user.organization_id}"
    return f"user_{current_user.id}"


# Preset role dependencies for common access patterns
require_admin = require_roles(UserRole.ADMIN)
require_ca_or_admin = require_roles(UserRole.ADMIN, UserRole.CA_FIRM)
require_analyst_plus = require_roles(UserRole.ADMIN, UserRole.CA_FIRM, UserRole.CFO, UserRole.ANALYST)

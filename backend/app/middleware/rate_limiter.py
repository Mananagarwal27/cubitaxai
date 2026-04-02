"""Rate limiting middleware backed by Redis via slowapi."""

from __future__ import annotations

import logging

from fastapi import Request, Response
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

from app.config import settings

logger = logging.getLogger(__name__)


def _key_func(request: Request) -> str:
    """Extract rate-limit key from authenticated user or IP address."""
    user = getattr(request.state, "user", None)
    if user:
        return f"user:{user.id}"
    return get_remote_address(request)


limiter = Limiter(
    key_func=_key_func,
    storage_uri=settings.redis_url,
    default_limits=["200/minute"],
)

# Preset limit strings for common route categories
CHAT_LIMIT = "60/minute"
UPLOAD_LIMIT = "10/minute"
AUTH_LIMIT = "20/minute"
REPORT_LIMIT = "15/minute"
ADMIN_LIMIT = "30/minute"


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Return a structured 429 response when rate limit is exceeded."""
    logger.warning("Rate limit exceeded for %s on %s", _key_func(request), request.url.path)
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please slow down.",
            "retry_after": str(exc.detail),
        },
        headers={"Retry-After": str(exc.detail)},
    )

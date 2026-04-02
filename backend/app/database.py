"""Database engine, session management, and metadata initialization."""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncAttrs, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(AsyncAttrs, DeclarativeBase):
    """Base class for all SQLAlchemy declarative models."""


engine = create_async_engine(
    settings.async_database_url,
    echo=settings.debug,
    future=True,
)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session for request-scoped usage."""

    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    """Import all models and create their database tables.

    All model modules must be imported before ``create_all`` so that
    SQLAlchemy registers every table in ``Base.metadata``.
    """

    # Ensure every model is imported (order doesn't matter)
    import app.models.organization  # noqa: F401
    import app.models.user  # noqa: F401
    import app.models.document  # noqa: F401
    import app.models.experiment  # noqa: F401
    import app.memory.entity_memory  # noqa: F401

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

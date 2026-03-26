"""FastAPI application entrypoint for CubitaxAI."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.dashboard import router as dashboard_router
from app.api.reports import router as reports_router
from app.api.upload import router as upload_router
from app.config import settings
from app.database import init_db
from app.memory.redis_memory import RedisMemoryManager
from app.memory.vector_store import VectorStoreManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize external dependencies and storage on startup."""

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.reports_dir.mkdir(parents=True, exist_ok=True)
    await init_db()

    redis_manager = RedisMemoryManager(settings.redis_url)
    await redis_manager.initialize()
    vector_store = VectorStoreManager()
    await vector_store.initialize()

    app.state.redis_memory = redis_manager
    app.state.vector_store = vector_store
    logger.info("CubitaxAI startup completed")
    try:
        yield
    finally:
        await redis_manager.close()
        await vector_store.close()
        logger.info("CubitaxAI shutdown completed")


def create_app() -> FastAPI:
    """Build and configure the FastAPI application instance."""

    application = FastAPI(
        title="CubitaxAI API",
        version=settings.app_version,
        docs_url="/docs",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(auth_router, prefix="/api/auth", tags=["auth"])
    application.include_router(chat_router, prefix="/api/chat", tags=["chat"])
    application.include_router(upload_router, prefix="/api/upload", tags=["upload"])
    application.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"])
    application.include_router(reports_router, prefix="/api/reports", tags=["reports"])

    @application.get("/health")
    async def health_check() -> dict[str, str]:
        """Return a simple health payload for probes and dashboards."""

        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "status": "ok",
        }

    return application


app = create_app()


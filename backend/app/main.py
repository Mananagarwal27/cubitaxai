"""FastAPI application entrypoint for CubitaxAI v2."""

from __future__ import annotations

import asyncio
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from collections import defaultdict
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.dashboard import router as dashboard_router
from app.api.reports import router as reports_router
from app.api.upload import router as upload_router
from app.api.deadlines import router as deadlines_router
from app.api.review import router as review_router
from app.api.client_portal import router as portal_router
from app.api.ca_dashboard import router as ca_router
from app.api.integrations import router as integrations_router
from app.api.websocket import router as websocket_router
from app.config import settings
import app.models.deadline  # noqa: F401
import app.models.review  # noqa: F401
import app.memory.entity_memory  # noqa: F401
from app.database import init_db
from app.memory.redis_memory import RedisMemoryManager
from app.memory.vector_store import VectorStoreManager
from app.middleware.rate_limiter import limiter, rate_limit_exceeded_handler
from app.models.schemas import ComponentHealth, HealthResponse
from app.observability.logging import CorrelationIdMiddleware, configure_logging, get_logger
from app.observability.metrics import MetricsMiddleware
from app.observability.metrics import router as metrics_router
from app.observability.tracing import init_tracing, instrument_fastapi

configure_logging(json_output=not settings.DEBUG)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize external dependencies and storage on startup."""

    import os
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    settings.reports_dir.mkdir(parents=True, exist_ok=True)
    await init_db()
    
    from app.services.audit_service import register_audit_listeners
    register_audit_listeners()

    redis_manager = RedisMemoryManager(settings.redis_url)
    await redis_manager.initialize()
    vector_store = VectorStoreManager()
    await vector_store.initialize()

    app.state.redis_memory = redis_manager
    app.state.vector_store = vector_store
    logger.info("startup_completed", 
                app=settings.app_name, 
                version=settings.app_version,
                upload_dir=settings.UPLOAD_DIR,
                email_alerts=settings.ALERT_EMAIL_ENABLED,
                traces_enabled=bool(settings.TRACES_CLIENT_ID),
                gst_enabled=bool(settings.GST_CLIENT_ID))
    try:
        yield
    finally:
        await redis_manager.close()
        await vector_store.close()
        logger.info("shutdown_completed")


def create_app() -> FastAPI:
    """Build and configure the FastAPI application instance."""

    application = FastAPI(
        title="CubitaxAI API",
        version=settings.app_version,
        docs_url="/docs",
        lifespan=lifespan,
    )

    # ── Middleware (order matters: last added = first executed) ────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
    )
    application.add_middleware(CorrelationIdMiddleware)
    application.add_middleware(MetricsMiddleware)

    # Rate limiting
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(request, exc):
        # Extract first error details
        error = exc.errors()[0]
        field = error.get("loc", ["unknown"])[-1]
        msg = error.get("msg", "Invalid field")
        return JSONResponse(
            status_code=422,
            content={"detail": msg, "field": field},
        )

    # OpenTelemetry
    init_tracing(service_name=settings.app_name)
    instrument_fastapi(application)

    # ── Routes ────────────────────────────────────────────────────────
    application.include_router(auth_router, prefix="/api/auth", tags=["auth"])
    application.include_router(chat_router, prefix="/api/chat", tags=["chat"])
    application.include_router(upload_router, prefix="/api/upload", tags=["upload"])
    application.include_router(deadlines_router, prefix="/api/deadlines", tags=["deadlines"])
    application.include_router(dashboard_router, prefix="/api/dashboard", tags=["dashboard"])
    application.include_router(reports_router, prefix="/api/reports", tags=["reports"])
    application.include_router(review_router, prefix="/api/reports", tags=["reports_review"])
    application.include_router(portal_router, prefix="/api/portal", tags=["portal"])
    application.include_router(ca_router, prefix="/api/ca", tags=["ca"])
    application.include_router(integrations_router, prefix="/api/integrations", tags=["integrations"])
    application.include_router(admin_router, prefix="/api/admin", tags=["admin"])
    application.include_router(metrics_router, tags=["observability"])
    application.include_router(websocket_router, tags=["websocket"])

    # ── Health Check ──────────────────────────────────────────────────

    @application.get("/health", response_model=HealthResponse)
    async def health_check() -> HealthResponse:
        """Return component-level health with latency measurements."""

        components: list[ComponentHealth] = []

        # Database
        try:
            from app.database import engine
            start = time.time()
            async with engine.connect() as conn:
                await conn.execute(
                    __import__("sqlalchemy").text("SELECT 1")
                )
            latency = (time.time() - start) * 1000
            components.append(ComponentHealth(name="database", status="healthy", latency_ms=round(latency, 2)))
        except Exception as exc:
            components.append(ComponentHealth(name="database", status="down", message=str(exc)[:100]))

        # Redis
        try:
            start = time.time()
            redis_mem: RedisMemoryManager = application.state.redis_memory
            if redis_mem.client:
                await redis_mem.client.ping()
                latency = (time.time() - start) * 1000
                components.append(ComponentHealth(name="redis", status="healthy", latency_ms=round(latency, 2)))
            else:
                components.append(ComponentHealth(name="redis", status="degraded", message="Using in-memory fallback"))
        except Exception as exc:
            components.append(ComponentHealth(name="redis", status="down", message=str(exc)[:100]))

        # Pinecone
        vs: VectorStoreManager = application.state.vector_store
        if vs.index:
            components.append(ComponentHealth(name="pinecone", status="healthy"))
        else:
            components.append(ComponentHealth(name="pinecone", status="degraded", message="Using local fallback"))

        # Neo4j
        try:
            from app.services.knowledge_graph import KnowledgeGraphService
            kg = KnowledgeGraphService()
            if await kg.health_check():
                components.append(ComponentHealth(name="neo4j", status="healthy"))
            else:
                components.append(ComponentHealth(name="neo4j", status="degraded", message="Not configured"))
        except Exception:
            components.append(ComponentHealth(name="neo4j", status="degraded", message="Not configured"))

        # LLM API
        from app.middleware.circuit_breaker import llm_circuit
        cb_status = llm_circuit.get_status()
        if cb_status["state"] == "closed":
            components.append(ComponentHealth(name="llm_api", status="healthy"))
        elif cb_status["state"] == "half_open":
            components.append(ComponentHealth(name="llm_api", status="degraded", message="Circuit half-open"))
        else:
            components.append(ComponentHealth(name="llm_api", status="down", message="Circuit breaker OPEN"))

        overall = "healthy"
        if any(c.status == "down" for c in components):
            overall = "degraded"
        if all(c.status == "down" for c in components):
            overall = "down"

        return HealthResponse(
            name=settings.app_name,
            version=settings.app_version,
            status=overall,
            components=components,
        )

    return application


app = create_app()

"""Application settings and environment parsing for CubitaxAI v2."""

from __future__ import annotations

from pathlib import Path
from typing import Any, List, Literal

from pydantic import Field, field_validator, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings object loaded from environment variables."""

    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "CubitaxAI"
    APP_VERSION: str = "2.0.0"
    APP_ENV: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False
    SECRET_KEY: str                          
    UPLOAD_DIR: str = "/app/uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # ── Database ─────────────────────────────────────────
    DATABASE_URL: str                        
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # ── Redis ────────────────────────────────────────────
    REDIS_URL: str = "redis://redis:6379/0"  

    # ── Celery ───────────────────────────────────────────
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    # ── JWT ──────────────────────────────────────────────
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # ── OpenAI ───────────────────────────────────────────
    OPENAI_API_KEY: str                      
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"

    # ── Pinecone ─────────────────────────────────────────
    PINECONE_API_KEY: str                    
    PINECONE_INDEX_NAME: str = "cubitaxai"
    PINECONE_ENVIRONMENT: str = "us-east-1"

    # ── Cohere ───────────────────────────────────────────
    COHERE_API_KEY: str                      

    # ── Neo4j ────────────────────────────────────────────
    NEO4J_URI: str = "bolt://neo4j:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str                      

    # ── LangSmith (optional but recommended) ─────────────
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "cubitaxai"

    # ── Email (for deadline alerts) ───────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""                      
    SMTP_PASSWORD: str = ""                  
    SMTP_FROM_NAME: str = "CubitaxAI Alerts"
    SMTP_USE_TLS: bool = True

    # ── TRACES / ITD Integration (for live data) ──────────
    TRACES_CLIENT_ID: str = ""              
    TRACES_CLIENT_SECRET: str = ""          
    TRACES_BASE_URL: str = "https://www.tdscpc.gov.in/app/api"

    # ── GST Portal Integration ────────────────────────────
    GST_CLIENT_ID: str = ""                 
    GST_CLIENT_SECRET: str = ""
    GST_BASE_URL: str = "https://api.gst.gov.in/commonapi"
    GST_OTP_BASE_URL: str = "https://api.gst.gov.in/commonapi/authenticate"

    # ── Tally / Accounting Sync ───────────────────────────
    TALLY_BRIDGE_URL: str = ""              
    ZOHO_CLIENT_ID: str = ""               
    ZOHO_CLIENT_SECRET: str = ""
    ZOHO_REFRESH_TOKEN: str = ""

    # ── Webhook / Notifications ───────────────────────────
    WEBHOOK_SECRET: str = ""               
    ALERT_EMAIL_ENABLED: bool = False
    ALERT_WEBHOOK_ENABLED: bool = False

    # ── RAGAS Evaluation ─────────────────────────────────
    RAGAS_EVAL_ENABLED: bool = False

    # ── Rate Limiting ─────────────────────────────────────
    RATE_LIMIT_CHAT: str = "60/minute"
    RATE_LIMIT_UPLOAD: str = "10/minute"

    # ── CORS ─────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # ── ChromaDB ─────────────────────────────────────────
    CHROMA_HOST: str = "chromadb"
    CHROMA_PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=(
            Path(__file__).resolve().parent.parent / ".env",        # backend/.env
            Path(__file__).resolve().parent.parent.parent / ".env", # project-root/.env
        ),
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_min_length(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_db_url(cls, v: str) -> str:
        valid_schemes = ("postgresql+asyncpg://", "sqlite+aiosqlite://")
        if not any(v.startswith(scheme) for scheme in valid_schemes):
            raise ValueError("DATABASE_URL must use postgresql+asyncpg:// or sqlite+aiosqlite:// scheme")
        return v

    # ── Lowercase property accessors ─────────────────────
    # These are used throughout the codebase for cleaner access.

    @property
    def async_database_url(self) -> str:
        """Return an async SQLAlchemy URL for the configured database."""
        return self.DATABASE_URL

    @property
    def redis_url(self) -> str:
        return self.REDIS_URL

    @property
    def celery_broker_url(self) -> str:
        return self.CELERY_BROKER_URL

    @property
    def celery_result_backend(self) -> str:
        return self.CELERY_RESULT_BACKEND

    @property
    def secret_key(self) -> str:
        return self.SECRET_KEY

    @property
    def algorithm(self) -> str:
        return self.ALGORITHM

    @property
    def access_token_expire_minutes(self) -> int:
        return self.ACCESS_TOKEN_EXPIRE_MINUTES

    @property
    def allowed_origins(self) -> list[str]:
        """Parse CORS_ORIGINS from comma-separated string."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def debug(self) -> bool:
        return self.DEBUG

    @property
    def upload_dir(self) -> Path:
        return Path(self.UPLOAD_DIR)

    @property
    def reports_dir(self) -> Path:
        return Path("generated_reports")

    @property
    def app_name(self) -> str:
        return self.APP_NAME

    @property
    def app_version(self) -> str:
        return self.APP_VERSION

    # ── External service key accessors ───────────────────

    @property
    def openai_api_key(self) -> str:
        return self.OPENAI_API_KEY

    @property
    def openai_model(self) -> str:
        return self.OPENAI_MODEL

    @property
    def openai_embedding_model(self) -> str:
        return self.OPENAI_EMBEDDING_MODEL

    @property
    def pinecone_api_key(self) -> str:
        return self.PINECONE_API_KEY

    @property
    def pinecone_index(self) -> str:
        return self.PINECONE_INDEX_NAME

    @property
    def pinecone_environment(self) -> str:
        return self.PINECONE_ENVIRONMENT

    @property
    def cohere_api_key(self) -> str:
        return self.COHERE_API_KEY

    @property
    def neo4j_uri(self) -> str:
        return self.NEO4J_URI

    @property
    def neo4j_user(self) -> str:
        return self.NEO4J_USER

    @property
    def neo4j_password(self) -> str:
        return self.NEO4J_PASSWORD

    @property
    def chroma_host(self) -> str:
        return self.CHROMA_HOST

    @property
    def chroma_port(self) -> int:
        return self.CHROMA_PORT

settings = Settings()

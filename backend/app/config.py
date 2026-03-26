"""Application settings and environment parsing for CubitaxAI."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings object loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    openai_api_key: str = Field(default="")
    openai_model: str = Field(default="gpt-4o")
    pinecone_api_key: str = Field(default="")
    pinecone_index: str = Field(default="cubitax-index")
    pinecone_env: str = Field(default="us-east-1")
    cohere_api_key: str = Field(default="")
    database_url: str = Field(default="sqlite+aiosqlite:///./cubitax.db")
    redis_url: str = Field(default="redis://localhost:6379/0")
    secret_key: str = Field(default="change-me-please-change-me-please")
    algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=1440)
    app_name: str = Field(default="CubitaxAI")
    app_version: str = Field(default="1.0.0")
    debug: bool = Field(default=True)
    allowed_origins: list[str] | str = Field(default="http://localhost:3000")
    upload_dir: Path = Field(default=Path("uploads"))
    reports_dir: Path = Field(default=Path("generated_reports"))
    chroma_host: str = Field(default="chromadb")
    chroma_port: int = Field(default=8000)

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: Any) -> list[str]:
        """Normalize comma-separated or list origin values."""

        if isinstance(value, list):
            return [item.strip() for item in value if str(item).strip()]
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return ["http://localhost:3000"]

    @property
    def async_database_url(self) -> str:
        """Return an async SQLAlchemy URL for the configured database."""

        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if self.database_url.startswith("sqlite://") and "+aiosqlite" not in self.database_url:
            return self.database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)
        return self.database_url


settings = Settings()

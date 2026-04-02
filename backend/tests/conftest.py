"""Shared pytest fixtures for CubitaxAI backend tests."""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

TEST_DB_PATH = Path(__file__).resolve().parent / "test_cubitaxai.db"
BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB_PATH}"
os.environ["REDIS_URL"] = "redis://localhost:6399/0"
os.environ["SECRET_KEY"] = "test-secret-key-for-cubitaxai-1234567890"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"
os.environ["DEBUG"] = "false"
os.environ["NEO4J_URI"] = "bolt://localhost:7699"
os.environ["NEO4J_USER"] = "neo4j"
os.environ["NEO4J_PASSWORD"] = "test_password"

from app.database import Base, engine  # noqa: E402
from app.main import create_app  # noqa: E402


async def _reset_database() -> None:
    """Drop and recreate all tables for an isolated test run."""
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)


@pytest.fixture(autouse=True)
def reset_database() -> None:
    """Reset persistent state before every test."""
    asyncio.run(_reset_database())


@pytest.fixture
def client() -> TestClient:
    """Create a TestClient with full FastAPI lifespan handling."""
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def registered_user(client: TestClient) -> dict[str, str]:
    """Register a default user and return auth headers."""
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": "test@example.com",
            "company_name": "Cubitax Test LLP",
            "pan_number": "ABCDE1234F",
            "gstin": "29ABCDE1234F1Z5",
            "password": "StrongPass1!",
        },
    )
    payload = response.json()
    return {
        "Authorization": f"Bearer {payload['access_token']}",
    }


@pytest.fixture
def admin_user(client: TestClient) -> dict[str, str]:
    """Register an admin user and return auth headers."""
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Admin User",
            "email": "admin@example.com",
            "company_name": "Cubitax Admin LLP",
            "pan_number": "ADMIN1234F",
            "gstin": "29ADMIN1234F1Z5",
            "password": "AdminPass1!",
            "role": "admin",
        },
    )
    payload = response.json()
    return {
        "Authorization": f"Bearer {payload['access_token']}",
    }

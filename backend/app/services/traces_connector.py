from cryptography.fernet import Fernet
from typing import Dict
import uuid
import json
import httpx
from datetime import datetime, timedelta

from app.config import settings

class TRACESConnector:
    BASE_URL = settings.TRACES_BASE_URL

    async def get_oauth_url(self, org_id: uuid.UUID, redirect_uri: str) -> str:
        # Mock OAuth URL creation
        client_id = settings.TRACES_CLIENT_ID
        return f"{self.BASE_URL}/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope=download_26as download_ais download_tis&state={org_id}"

    async def exchange_code(self, code: str, org_id: uuid.UUID) -> dict:
        # Mock token creation
        return {
            "access_token": "mock_acesstoken_42",
            "refresh_token": "mock_refreshtoken_42",
            "expires_in": 3600,
            "scope": "download_26as"
        }

    async def refresh_token(self, org_id: uuid.UUID) -> dict:
        return {
            "access_token": "mock_acesstoken_43",
            "refresh_token": "mock_refreshtoken_43",
            "expires_in": 3600
        }

    async def fetch_26as(self, org_id: uuid.UUID, financial_year: str) -> bytes:
        # Return a mock tiny PDF
        return b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"

    async def fetch_ais(self, org_id: uuid.UUID, financial_year: str) -> dict:
        # Return mock AIS JSON
        return {
            "pan": "ABCDE1234F",
            "salary": 1500000,
            "interest": 25000,
            "tds": 150000
        }

    async def schedule_auto_refresh(self, org_id: uuid.UUID):
        # Dummy schedule
        pass

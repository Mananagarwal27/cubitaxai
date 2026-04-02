"""WebSocket endpoint for real-time ingestion progress and notifications."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter()

# Active WebSocket connections keyed by user_id
_connections: dict[str, list[WebSocket]] = {}


async def send_progress(user_id: str, event: dict[str, Any]) -> None:
    """Send a progress event to all WebSocket connections for a user."""
    connections = _connections.get(user_id, [])
    dead: list[WebSocket] = []
    for ws in connections:
        try:
            await ws.send_text(json.dumps(event))
        except Exception:
            dead.append(ws)
    for ws in dead:
        connections.remove(ws)


@router.websocket("/ws/progress/{user_id}")
async def websocket_progress(websocket: WebSocket, user_id: str) -> None:
    """WebSocket endpoint for real-time document ingestion progress."""
    await websocket.accept()
    _connections.setdefault(user_id, []).append(websocket)
    logger.info("WebSocket connected for user %s", user_id)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for user %s", user_id)
    finally:
        connections = _connections.get(user_id, [])
        if websocket in connections:
            connections.remove(websocket)

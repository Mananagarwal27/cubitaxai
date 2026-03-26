"""Celery application and background tasks for document ingestion."""

from __future__ import annotations

import asyncio
import logging

from celery import Celery

from app.agents.ingestor import DocumentIngestorAgent
from app.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery("cubitaxai", broker=settings.redis_url, backend=settings.redis_url)


@celery_app.task(name="process_document")
def process_document(doc_id: str, user_id: str, file_path: str) -> dict[str, str | int]:
    """Process an uploaded document asynchronously."""

    result = asyncio.run(DocumentIngestorAgent().ingest_document(doc_id=doc_id, user_id=user_id, file_path=file_path))
    logger.info("Document %s processed for user %s: %s", doc_id, user_id, result)
    logger.info("Notification: document %s ingestion completed", doc_id)
    return result


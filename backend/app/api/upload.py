"""Document upload and ingestion API routes (v2 — dedup + org namespace)."""

from __future__ import annotations

import asyncio
import hashlib
import logging
import tempfile
from pathlib import Path
from uuid import UUID
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.ingestor import DocumentIngestorAgent
from app.database import get_db
from app.dependencies import get_org_namespace
from app.models.document import Document, DocumentStatus, DocumentType
from app.models.schemas import DocumentItem, DocumentListResponse, DocumentUploadResponse
from app.models.user import User
from app.observability.metrics import increment_counter
from app.services.auth_service import get_current_user
from app.tasks.celery_tasks import process_document

logger = logging.getLogger(__name__)

router = APIRouter()
MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024


async def _dispatch_ingestion(doc_id: str, user_id: str, file_path: str) -> None:
    """Dispatch ingestion to Celery and fall back to local async execution."""

    try:
        process_document.delay(doc_id=doc_id, user_id=user_id, file_path=file_path)
    except Exception as exc:  # pragma: no cover - depends on broker availability
        logger.warning("Celery unavailable, running local ingestion fallback: %s", exc)
        agent = DocumentIngestorAgent()
        asyncio.create_task(agent.ingest_document(doc_id=doc_id, user_id=user_id, file_path=file_path))


@router.post("/document", response_model=DocumentUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    namespace: str = Depends(get_org_namespace),
    db: AsyncSession = Depends(get_db),
) -> DocumentUploadResponse:
    """Accept a PDF upload and trigger asynchronous ingestion."""

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF uploads are supported")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="PDF exceeds 100MB limit")

    # Duplicate detection via content hash
    content_hash = hashlib.sha256(file_bytes).hexdigest()
    existing = await db.execute(
        select(Document).where(
            Document.user_id == current_user.id,
            Document.content_hash == content_hash,
            Document.status != DocumentStatus.ARCHIVED,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A document with identical content has already been uploaded",
        )

    tmp_dir = Path(tempfile.gettempdir()) / "cubitaxai_uploads"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    file_path = tmp_dir / f"{uuid4().hex}.pdf"
    await asyncio.to_thread(file_path.write_bytes, file_bytes)

    document = Document(
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        filename=file.filename,
        file_type=DocumentType.OTHER,
        status=DocumentStatus.PROCESSING,
        chunk_count=0,
        pinecone_namespace=namespace,
        content_hash=content_hash,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    increment_counter("total_uploads")
    await _dispatch_ingestion(str(document.id), str(current_user.id), str(file_path))
    return DocumentUploadResponse(doc_id=document.id, status=document.status, filename=document.filename)


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    """Return all documents uploaded by the authenticated user."""

    result = await db.execute(
        select(Document).where(Document.user_id == current_user.id).order_by(Document.uploaded_at.desc())
    )
    documents = result.scalars().all()
    return DocumentListResponse(documents=[DocumentItem.model_validate(document) for document in documents])


@router.get("/documents/{doc_id}/status", response_model=DocumentItem)
async def get_document_status(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentItem:
    """Return status for a single uploaded document."""

    result = await db.execute(
        select(Document).where(Document.id == UUID(doc_id), Document.user_id == current_user.id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentItem.model_validate(document)


@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Soft-delete (archive) a document."""

    result = await db.execute(
        select(Document).where(Document.id == UUID(doc_id), Document.user_id == current_user.id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    document.status = DocumentStatus.ARCHIVED
    await db.commit()
    return Response(status_code=204)

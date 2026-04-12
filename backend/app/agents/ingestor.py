"""Document ingestion agent for parsing, chunking, and indexing uploads."""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.memory.vector_store import VectorStoreManager
from app.models.document import Document, DocumentStatus, DocumentType
from app.services.chunker import chunk_tax_document
from app.services.pdf_parser import parse_pdf
from app.observability.logging import get_logger

logger = get_logger(__name__)


class DocumentIngestorAgent:
    """Parse uploaded documents and push retrieval-ready chunks to storage."""

    def __init__(self, vector_store: VectorStoreManager | None = None) -> None:
        """Initialize the ingestor with a vector store manager."""

        self.vector_store = vector_store or VectorStoreManager()

    async def ingest_document(self, doc_id: str, user_id: str, file_path: str) -> dict[str, str | int]:
        """Ingest a document end-to-end and update its database state."""

        await self.vector_store.initialize()
        namespace = f"user_{user_id}"

        try:
            parsed_doc = await asyncio.to_thread(parse_pdf, file_path)
            chunks = chunk_tax_document(parsed_doc)
            chunk_count = await self.vector_store.embed_and_upsert(chunks, namespace, doc_id)

            async with AsyncSessionLocal() as session:
                result = await session.execute(select(Document).where(Document.id == uuid.UUID(doc_id)))
                document = result.scalar_one()
                document.file_type = DocumentType(parsed_doc["doc_type"])
                document.status = DocumentStatus.INDEXED
                document.chunk_count = chunk_count
                document.pinecone_namespace = namespace
                document.indexed_at = datetime.now(timezone.utc)
                await session.commit()
            logger.info("document_ingested", doc_id=doc_id, user_id=user_id, chunk_count=chunk_count, doc_type=parsed_doc.get("doc_type"))
            return {"status": DocumentStatus.INDEXED.value, "chunk_count": chunk_count}
        except Exception as exc:
            logger.error("document_ingestion_failed", doc_id=doc_id, user_id=user_id, error=str(exc), exc_info=True)
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(Document).where(Document.id == uuid.UUID(doc_id)))
                document = result.scalar_one_or_none()
                if document:
                    document.status = DocumentStatus.FAILED
                    await session.commit()
            return {"status": DocumentStatus.FAILED.value, "chunk_count": 0, "error": str(exc)}

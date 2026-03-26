"""PDF parsing utilities powered by PyMuPDF."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.models.document import DocumentType

logger = logging.getLogger(__name__)


def _detect_document_type(full_text: str) -> DocumentType:
    """Infer the document type from extracted content keywords."""

    text = full_text.lower()
    if "form 26as" in text:
        return DocumentType.FORM_26AS
    if "gstr-3b" in text or "gstr-1" in text or "gstin" in text:
        return DocumentType.GSTR
    if "tds certificate" in text or "form 16" in text:
        return DocumentType.TDS_CERT
    if "income tax return" in text or "acknowledgement number" in text:
        return DocumentType.ITR
    if "circular no." in text or "cbic" in text:
        return DocumentType.GST_CIRCULAR
    if "income-tax act" in text or "section 80c" in text:
        return DocumentType.IT_ACT
    return DocumentType.OTHER


def parse_pdf(file_path: str | Path) -> dict[str, Any]:
    """Extract structured content from a PDF document.

    Args:
        file_path: Filesystem path to the PDF file.

    Returns:
        Structured dictionary containing pages, tables, metadata, and doc type.
    """

    path = Path(file_path)
    if path.suffix.lower() != ".pdf":
        raise ValueError("Only PDF files are supported")

    pages: list[dict[str, Any]] = []
    tables: list[dict[str, Any]] = []
    full_text_parts: list[str] = []

    try:
        import fitz

        with fitz.open(path) as document:
            metadata = document.metadata or {}
            for page_index, page in enumerate(document, start=1):
                text = page.get_text("text").strip()
                full_text_parts.append(text)
                pages.append({"page_num": page_index, "text": text})

                try:
                    detected_tables = page.find_tables()
                    for table_index, table in enumerate(detected_tables.tables, start=1):
                        tables.append(
                            {
                                "page_num": page_index,
                                "table_num": table_index,
                                "rows": table.extract(),
                            }
                        )
                except Exception as exc:  # pragma: no cover - depends on PDF structure
                    logger.debug("Table detection failed on page %s: %s", page_index, exc)

        full_text = "\n".join(full_text_parts)
        return {
            "pages": pages,
            "tables": tables,
            "metadata": metadata,
            "doc_type": _detect_document_type(full_text).value,
        }
    except Exception as exc:
        logger.exception("Failed to parse PDF %s", path)
        raise ValueError(f"Unable to parse PDF: {path.name}") from exc

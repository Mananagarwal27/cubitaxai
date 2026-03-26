"""Section-aware chunking for tax and compliance documents."""

from __future__ import annotations

import re
from typing import Any


SECTION_PATTERN = re.compile(r"(Section\s+\d+[A-Z]?|Sec\.?\s*\d+[A-Z]?|Circular No\.[^\n]+|Rule\s+\d+[A-Z]?)", re.IGNORECASE)
DATE_PATTERN = re.compile(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b")
SENTENCE_PATTERN = re.compile(r"(?<=[.!?])\s+")


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences without cutting on every newline."""

    normalized = re.sub(r"\s+", " ", text.strip())
    if not normalized:
        return []
    return [sentence.strip() for sentence in SENTENCE_PATTERN.split(normalized) if sentence.strip()]


def _extract_section_ref(text: str, fallback: str = "General") -> str:
    """Extract the closest section or circular marker from the text."""

    match = SECTION_PATTERN.search(text)
    return match.group(1).strip() if match else fallback


def chunk_tax_document(parsed_doc: dict[str, Any]) -> list[dict[str, Any]]:
    """Chunk a parsed tax document into section-aware retrieval units.

    Args:
        parsed_doc: Parsed PDF structure from the PDF parser.

    Returns:
        A list of chunk dictionaries with metadata required for retrieval.
    """

    chunks: list[dict[str, Any]] = []
    doc_type = parsed_doc.get("doc_type", "OTHER")

    for page in parsed_doc.get("pages", []):
        page_num = page["page_num"]
        text = page.get("text", "")
        if not text.strip():
            continue

        segments = []
        last_index = 0
        matches = list(SECTION_PATTERN.finditer(text))
        if matches:
            for match in matches:
                if match.start() > last_index:
                    segments.append(text[last_index:match.start()])
                last_index = match.start()
            segments.append(text[last_index:])
        else:
            segments = [text]

        for raw_segment in segments:
            sentences = _split_sentences(raw_segment)
            if not sentences:
                continue

            section_ref = _extract_section_ref(raw_segment)
            effective_date_match = DATE_PATTERN.search(raw_segment)
            effective_date = effective_date_match.group(1) if effective_date_match else None

            current_sentences: list[str] = []
            current_tokens = 0
            overlap_tail: list[str] = []

            for sentence in sentences:
                token_count = len(sentence.split())
                if current_sentences and current_tokens + token_count > 512:
                    chunk_text = " ".join(current_sentences).strip()
                    chunks.append(
                        {
                            "text": chunk_text,
                            "section_ref": section_ref,
                            "page_num": page_num,
                            "doc_type": doc_type,
                            "effective_date": effective_date,
                        }
                    )

                    overlap_tail = chunk_text.split()[-50:]
                    current_sentences = [" ".join(overlap_tail)] if overlap_tail else []
                    current_tokens = len(overlap_tail)

                current_sentences.append(sentence)
                current_tokens += token_count

            if current_sentences:
                chunks.append(
                    {
                        "text": " ".join(current_sentences).strip(),
                        "section_ref": section_ref,
                        "page_num": page_num,
                        "doc_type": doc_type,
                        "effective_date": effective_date,
                    }
                )

    return chunks


"""Embedding utilities for chunk vectors and similarity operations."""

from __future__ import annotations

import hashlib
from typing import Sequence

from app.config import settings


class EmbeddingService:
    """Provide real or deterministic fallback embeddings for retrieval."""

    def __init__(self) -> None:
        """Initialize the embedding backend."""

        self._client = None
        if settings.openai_api_key:
            from langchain_openai import OpenAIEmbeddings

            self._client = OpenAIEmbeddings(
                api_key=settings.openai_api_key,
                model="text-embedding-3-large",
            )

    def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        """Embed multiple documents for vector indexing."""

        if self._client:
            return self._client.embed_documents(list(texts))
        return [self._fallback_embedding(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        """Embed a single query string."""

        if self._client:
            return self._client.embed_query(text)
        return self._fallback_embedding(text)

    @staticmethod
    def _fallback_embedding(text: str, dims: int = 32) -> list[float]:
        """Create a deterministic lightweight embedding when no API key exists."""

        digest = hashlib.sha256(text.encode("utf-8")).digest()
        values = []
        for index in range(dims):
            values.append(digest[index % len(digest)] / 255)
        return values

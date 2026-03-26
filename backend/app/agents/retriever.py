"""Hybrid retrieval agent for tax knowledge and user documents."""

from __future__ import annotations

from typing import Any

from app.memory.vector_store import SearchChunk, VectorStoreManager
from app.models.schemas import Citation


class TaxRetrieverAgent:
    """Search global tax knowledge and user namespaces with reranking."""

    def __init__(self, vector_store: VectorStoreManager) -> None:
        """Bind the retriever to the shared vector store manager."""

        self.vector_store = vector_store

    async def retrieve(
        self,
        query: str,
        user_id: str,
        doc_type_filter: str | None = None,
    ) -> list[SearchChunk]:
        """Retrieve and rerank the most relevant chunks for a query."""

        filter_dict = {"doc_type": doc_type_filter} if doc_type_filter else None
        global_results = await self.vector_store.hybrid_search(
            query=query,
            namespace="global-tax-knowledge",
            top_k=12,
            filter_dict=filter_dict,
        )
        user_results = await self.vector_store.hybrid_search(
            query=query,
            namespace=f"user_{user_id}",
            top_k=12,
            filter_dict=filter_dict,
        )

        deduplicated: dict[str, SearchChunk] = {}
        for result in global_results + user_results:
            key = f"{result.metadata.get('section_ref')}::{result.text[:120]}"
            existing = deduplicated.get(key)
            if not existing or result.score > existing.score:
                deduplicated[key] = result
        return await self.vector_store.rerank(query, list(deduplicated.values()))

    @staticmethod
    def to_citations(chunks: list[SearchChunk]) -> list[Citation]:
        """Convert search results into API-ready citation objects."""

        citations: list[Citation] = []
        for chunk in chunks:
            citations.append(
                Citation(
                    source=str(chunk.metadata.get("source", chunk.metadata.get("doc_type", "DOCUMENT"))),
                    section_ref=str(chunk.metadata.get("section_ref", "General")),
                    snippet=chunk.text[:240],
                    score=round(chunk.score, 4),
                )
            )
        return citations


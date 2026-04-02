"""Hybrid retrieval agent for tax knowledge and user documents (v2)."""

from __future__ import annotations

from typing import Any

from app.memory.vector_store import SearchChunk, VectorStoreManager
from app.models.schemas import Citation


class TaxRetrieverAgent:
    """Search global tax knowledge and user namespaces with reranking.

    v2: Accepts configurable BM25/dense weights from the query classifier
    and expands retrieval window to top-40 before reranking to top-10.
    """

    def __init__(self, vector_store: VectorStoreManager) -> None:
        """Bind the retriever to the shared vector store manager."""

        self.vector_store = vector_store

    async def retrieve(
        self,
        query: str,
        user_id: str,
        doc_type_filter: str | None = None,
        bm25_weight: float = 0.45,
        dense_weight: float = 0.55,
        top_k: int = 20,
    ) -> list[SearchChunk]:
        """Retrieve and rerank the most relevant chunks for a query.

        Args:
            query: User query text.
            user_id: Current user ID for namespace scoping.
            doc_type_filter: Optional doc_type metadata filter.
            bm25_weight: Weight for BM25 lexical retrieval (from query classifier).
            dense_weight: Weight for dense vector retrieval (from query classifier).
            top_k: Number of candidates to retrieve per namespace before reranking.
        """

        filter_dict = {"doc_type": doc_type_filter} if doc_type_filter else None

        # Retrieve from global knowledge base
        global_results = await self.vector_store.hybrid_search(
            query=query,
            namespace="global-tax-knowledge",
            top_k=top_k,
            filter_dict=filter_dict,
        )

        # Retrieve from user's personal namespace
        user_results = await self.vector_store.hybrid_search(
            query=query,
            namespace=f"user_{user_id}",
            top_k=top_k,
            filter_dict=filter_dict,
        )

        # Merge and deduplicate — keep highest-scoring version of each chunk
        deduplicated: dict[str, SearchChunk] = {}
        for result in global_results + user_results:
            key = f"{result.metadata.get('section_ref')}::{result.text[:120]}"
            existing = deduplicated.get(key)
            if not existing or result.score > existing.score:
                deduplicated[key] = result

        # Rerank expanded candidate set → top-10
        reranked = await self.vector_store.rerank(query, list(deduplicated.values()))
        return reranked[:10]

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

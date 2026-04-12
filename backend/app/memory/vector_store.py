"""Vector and lexical retrieval management for CubitaxAI."""

from __future__ import annotations

import asyncio
import logging
import math
import re
import uuid
from collections import defaultdict
from dataclasses import dataclass
from typing import Any

from app.config import settings
from app.services.embedder import EmbeddingService, _has_real_api_key

try:  # pragma: no cover - optional BM25 dependency
    from rank_bm25 import BM25Okapi
except Exception:  # pragma: no cover
    BM25Okapi = None

logger = logging.getLogger(__name__)

try:  # pragma: no cover - external SDK behavior varies by environment
    from pinecone import Pinecone
except Exception:  # pragma: no cover
    Pinecone = None

try:  # pragma: no cover - optional external API
    import cohere
except Exception:  # pragma: no cover
    cohere = None


@dataclass
class SearchChunk:
    """Normalized search result used across retrieval and synthesis layers."""

    id: str
    text: str
    metadata: dict[str, Any]
    score: float


class VectorStoreManager:
    """Coordinate vector indexing, hybrid retrieval, and reranking."""

    def __init__(self) -> None:
        """Initialize clients lazily to survive local development without keys."""

        self.embedding_service = EmbeddingService()
        self.pinecone = None
        self.index = None
        self.cohere_client = (
            cohere.Client(settings.cohere_api_key)
            if cohere and _has_real_api_key(settings.cohere_api_key)
            else None
        )
        self._local_store: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self._chroma_client = None

    async def initialize(self) -> None:
        """Establish vector database clients when credentials are configured."""

        if _has_real_api_key(settings.pinecone_api_key) and Pinecone:
            try:
                self.pinecone = Pinecone(api_key=settings.pinecone_api_key)
                self.index = self.pinecone.Index(settings.pinecone_index)
            except Exception as exc:  # pragma: no cover - depends on external service
                logger.warning("Pinecone initialization failed, using fallback store: %s", exc)
                self.index = None
        try:
            import chromadb

            self._chroma_client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
            self._chroma_client.heartbeat()
        except Exception as exc:  # pragma: no cover - depends on running service
            logger.warning("Chroma initialization failed, continuing without remote Chroma: %s", exc)
            self._chroma_client = None

    async def embed_and_upsert(self, chunks: list[dict[str, Any]], namespace: str, doc_id: str) -> int:
        """Embed chunk texts and store them in the active vector backends."""

        if not chunks:
            return 0

        texts = [chunk["text"] for chunk in chunks]
        embeddings = await asyncio.to_thread(self.embedding_service.embed_documents, texts)
        vectors = []

        for index, (chunk, embedding) in enumerate(zip(chunks, embeddings, strict=False)):
            vector_id = f"{doc_id}-{index}-{uuid.uuid4().hex[:8]}"
            metadata = {**chunk, "doc_id": doc_id, "text": chunk["text"]}
            record = {"id": vector_id, "text": chunk["text"], "metadata": metadata, "embedding": embedding}
            self._local_store[namespace].append(record)
            vectors.append({"id": vector_id, "values": embedding, "metadata": metadata})

        if self.index:
            try:
                await asyncio.to_thread(self.index.upsert, vectors=vectors, namespace=namespace)
            except Exception as exc:  # pragma: no cover - external service path
                logger.warning("Pinecone upsert failed for namespace %s: %s", namespace, exc)

        if self._chroma_client:
            try:
                collection = self._chroma_client.get_or_create_collection(namespace)
                collection.upsert(
                    ids=[record["id"] for record in self._local_store[namespace][-len(vectors):]],
                    documents=texts,
                    embeddings=embeddings,
                    metadatas=[record["metadata"] for record in self._local_store[namespace][-len(vectors):]],
                )
            except Exception as exc:  # pragma: no cover - service-dependent
                logger.warning("Chroma upsert failed for namespace %s: %s", namespace, exc)

        return len(chunks)

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        """Simple whitespace + lowercased tokenizer for BM25."""
        return re.findall(r"\w+", text.lower())

    @staticmethod
    def _rrf_fuse(
        *ranked_lists: list[tuple[str, SearchChunk]],
        k: int = 60,
    ) -> dict[str, float]:
        """Reciprocal Rank Fusion across multiple ranked result lists.

        Each entry in a ranked_list is (chunk_id, SearchChunk).
        Returns a dict mapping chunk_id → fused score.
        """
        fused_scores: dict[str, float] = defaultdict(float)
        for ranked in ranked_lists:
            for rank, (chunk_id, _chunk) in enumerate(ranked, start=1):
                fused_scores[chunk_id] += 1.0 / (k + rank)
        return dict(fused_scores)

    async def hybrid_search(
        self,
        query: str,
        namespace: str,
        top_k: int = 20,
        filter_dict: Optional[dict[str, Any]] = None,
        bm25_weight: float = 0.45,
        dense_weight: float = 0.55,
    ) -> list[SearchChunk]:
        """Run dense + BM25 lexical search with Reciprocal Rank Fusion.

        Args:
            bm25_weight: Weight for BM25 scores in the final fusion.
            dense_weight: Weight for dense vector scores in the final fusion.
        """

        query_embedding = await asyncio.to_thread(self.embedding_service.embed_query, query)
        query_tokens = self._tokenize(query)

        # Collect all candidate chunks keyed by id
        all_chunks: dict[str, SearchChunk] = {}

        # ── Local store dense + BM25 ─────────────────────────────────
        local_records = [
            rec for rec in self._local_store.get(namespace, [])
            if not filter_dict or all(rec["metadata"].get(k) == v for k, v in filter_dict.items())
        ]

        # Dense scoring from local store
        dense_local: list[tuple[str, SearchChunk]] = []
        for record in local_records:
            score = self._cosine_similarity(query_embedding, record["embedding"])
            chunk = SearchChunk(
                id=record["id"],
                text=record["text"],
                metadata=record["metadata"],
                score=score,
            )
            all_chunks[record["id"]] = chunk
            dense_local.append((record["id"], chunk))
        dense_local.sort(key=lambda x: x[1].score, reverse=True)

        # BM25 scoring from local store
        bm25_local: list[tuple[str, SearchChunk]] = []
        if local_records and BM25Okapi and query_tokens:
            corpus = [self._tokenize(rec["text"]) for rec in local_records]
            bm25 = BM25Okapi(corpus)
            bm25_scores = bm25.get_scores(query_tokens)
            for idx, bm25_score in enumerate(bm25_scores):
                rec = local_records[idx]
                chunk = all_chunks.get(rec["id"]) or SearchChunk(
                    id=rec["id"], text=rec["text"], metadata=rec["metadata"], score=0.0,
                )
                bm25_local.append((rec["id"], SearchChunk(
                    id=chunk.id, text=chunk.text, metadata=chunk.metadata, score=float(bm25_score),
                )))
            bm25_local.sort(key=lambda x: x[1].score, reverse=True)
        elif local_records and query_tokens:
            # Fallback: simple term overlap when rank_bm25 is unavailable
            query_set = set(query_tokens)
            for rec in local_records:
                overlap = len(query_set.intersection(self._tokenize(rec["text"])))
                chunk = all_chunks.get(rec["id"]) or SearchChunk(
                    id=rec["id"], text=rec["text"], metadata=rec["metadata"], score=0.0,
                )
                bm25_local.append((rec["id"], SearchChunk(
                    id=chunk.id, text=chunk.text, metadata=chunk.metadata, score=float(overlap),
                )))
            bm25_local.sort(key=lambda x: x[1].score, reverse=True)

        # ── Pinecone dense search ────────────────────────────────────
        pinecone_ranked: list[tuple[str, SearchChunk]] = []
        if self.index:
            try:
                response = await asyncio.to_thread(
                    self.index.query,
                    vector=query_embedding,
                    top_k=top_k,
                    include_metadata=True,
                    namespace=namespace,
                    filter=filter_dict,
                )
                for match in getattr(response, "matches", []):
                    metadata = dict(getattr(match, "metadata", {}) or {})
                    score = float(getattr(match, "score", 0.0))
                    chunk = SearchChunk(
                        id=match.id,
                        text=metadata.get("text", ""),
                        metadata=metadata,
                        score=score,
                    )
                    all_chunks[match.id] = chunk
                    pinecone_ranked.append((match.id, chunk))
            except Exception as exc:  # pragma: no cover - external service path
                logger.warning("Pinecone query failed for namespace %s: %s", namespace, exc)

        # ── Chroma dense search ───────────────────────────────────────
        chroma_ranked: list[tuple[str, SearchChunk]] = []
        if self._chroma_client:
            try:
                collection = self._chroma_client.get_or_create_collection(namespace)
                chroma_response = await asyncio.to_thread(
                    collection.query,
                    query_embeddings=[query_embedding],
                    n_results=top_k,
                    where=filter_dict,
                    include=["documents", "metadatas", "distances"],
                )
                ids = chroma_response.get("ids", [[]])[0]
                documents = chroma_response.get("documents", [[]])[0]
                metadatas = chroma_response.get("metadatas", [[]])[0]
                distances = chroma_response.get("distances", [[]])[0]

                for chunk_id, text, metadata, distance in zip(ids, documents, metadatas, distances, strict=False):
                    similarity_score = max(0.0, 1.0 - float(distance or 0.0))
                    chunk = SearchChunk(
                        id=chunk_id,
                        text=text or "",
                        metadata=dict(metadata or {}),
                        score=similarity_score,
                    )
                    all_chunks.setdefault(chunk_id, chunk)
                    chroma_ranked.append((chunk_id, chunk))
            except Exception as exc:  # pragma: no cover - service-dependent
                logger.warning("Chroma query failed for namespace %s: %s", namespace, exc)

        # ── Reciprocal Rank Fusion ────────────────────────────────────
        # Build weighted RRF from dense lists and BM25 list
        dense_lists = [l for l in (dense_local, pinecone_ranked, chroma_ranked) if l]
        bm25_lists = [bm25_local] if bm25_local else []

        # Apply per-list RRF then weight by dense_weight / bm25_weight
        final_scores: dict[str, float] = defaultdict(float)
        for ranked_list in dense_lists:
            for rank, (chunk_id, _) in enumerate(ranked_list[:top_k * 2], start=1):
                final_scores[chunk_id] += dense_weight / (60 + rank)
        for ranked_list in bm25_lists:
            for rank, (chunk_id, _) in enumerate(ranked_list[:top_k * 2], start=1):
                final_scores[chunk_id] += bm25_weight / (60 + rank)

        # Produce final sorted list
        ordered_ids = sorted(final_scores, key=final_scores.get, reverse=True)
        result: list[SearchChunk] = []
        for chunk_id in ordered_ids[:top_k]:
            if chunk_id in all_chunks:
                chunk = all_chunks[chunk_id]
                result.append(SearchChunk(
                    id=chunk.id,
                    text=chunk.text,
                    metadata=chunk.metadata,
                    score=final_scores[chunk_id],
                ))
        return result

    async def rerank(self, query: str, documents: list[SearchChunk]) -> list[SearchChunk]:
        """Rerank documents using Cohere when available, else lexical fallback."""

        if not documents:
            return []
        if self.cohere_client:
            try:
                rerank_response = await asyncio.to_thread(
                    self.cohere_client.rerank,
                    query=query,
                    documents=[document.text for document in documents],
                    top_n=min(5, len(documents)),
                )
                reranked: list[SearchChunk] = []
                for result in rerank_response.results:
                    chunk = documents[result.index]
                    reranked.append(
                        SearchChunk(
                            id=chunk.id,
                            text=chunk.text,
                            metadata=chunk.metadata,
                            score=float(result.relevance_score),
                        )
                    )
                return reranked
            except Exception as exc:  # pragma: no cover - external service path
                logger.warning("Cohere rerank failed, using fallback sort: %s", exc)

        lexical_terms = set(query.lower().split())
        ordered = sorted(
            documents,
            key=lambda item: item.score + len(lexical_terms.intersection(item.text.lower().split())) * 0.1,
            reverse=True,
        )
        return ordered[:5]

    async def delete_document(self, doc_id: str, namespace: str) -> None:
        """Delete all chunks for a document from the active backends."""

        retained = [record for record in self._local_store.get(namespace, []) if record["metadata"].get("doc_id") != doc_id]
        deleted_ids = [
            record["id"] for record in self._local_store.get(namespace, []) if record["metadata"].get("doc_id") == doc_id
        ]
        self._local_store[namespace] = retained

        if self.index and deleted_ids:
            try:
                await asyncio.to_thread(self.index.delete, ids=deleted_ids, namespace=namespace)
            except Exception as exc:  # pragma: no cover
                logger.warning("Pinecone delete failed for %s: %s", doc_id, exc)

        if self._chroma_client and deleted_ids:
            try:
                collection = self._chroma_client.get_or_create_collection(namespace)
                collection.delete(ids=deleted_ids)
            except Exception as exc:  # pragma: no cover
                logger.warning("Chroma delete failed for %s: %s", doc_id, exc)

    async def close(self) -> None:
        """Release any vector resources if needed."""

        self.index = None

    @staticmethod
    def _cosine_similarity(left: list[float], right: list[float]) -> float:
        """Compute cosine similarity between two numeric vectors."""

        numerator = sum(l * r for l, r in zip(left, right, strict=False))
        left_norm = math.sqrt(sum(value * value for value in left))
        right_norm = math.sqrt(sum(value * value for value in right))
        if not left_norm or not right_norm:
            return 0.0
        return numerator / (left_norm * right_norm)

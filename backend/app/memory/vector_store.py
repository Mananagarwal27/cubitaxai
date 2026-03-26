"""Vector and lexical retrieval management for CubitaxAI."""

from __future__ import annotations

import asyncio
import logging
import math
import uuid
from collections import defaultdict
from dataclasses import dataclass
from typing import Any

from app.config import settings
from app.services.embedder import EmbeddingService

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
        self.cohere_client = cohere.Client(settings.cohere_api_key) if cohere and settings.cohere_api_key else None
        self._local_store: dict[str, list[dict[str, Any]]] = defaultdict(list)
        self._chroma_client = None

    async def initialize(self) -> None:
        """Establish vector database clients when credentials are configured."""

        if settings.pinecone_api_key and Pinecone:
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

    async def hybrid_search(
        self,
        query: str,
        namespace: str,
        top_k: int = 20,
        filter_dict: dict[str, Any] | None = None,
    ) -> list[SearchChunk]:
        """Run a dense-plus-lexical search for the requested namespace."""

        query_embedding = await asyncio.to_thread(self.embedding_service.embed_query, query)
        lexical_terms = set(query.lower().split())
        combined_scores: dict[str, SearchChunk] = {}

        for record in self._local_store.get(namespace, []):
            if filter_dict and any(record["metadata"].get(key) != value for key, value in filter_dict.items()):
                continue
            lexical_score = len(lexical_terms.intersection(record["text"].lower().split()))
            dense_score = self._cosine_similarity(query_embedding, record["embedding"])
            score = dense_score + lexical_score * 0.15
            combined_scores[record["id"]] = SearchChunk(
                id=record["id"],
                text=record["text"],
                metadata=record["metadata"],
                score=score,
            )

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
                    current = combined_scores.get(match.id)
                    score = float(getattr(match, "score", 0.0))
                    if current:
                        current.score = max(current.score, score + current.score)
                    else:
                        combined_scores[match.id] = SearchChunk(
                            id=match.id,
                            text=metadata.get("text", ""),
                            metadata=metadata,
                            score=score,
                        )
            except Exception as exc:  # pragma: no cover - external service path
                logger.warning("Pinecone query failed for namespace %s: %s", namespace, exc)

        ordered = sorted(combined_scores.values(), key=lambda item: item.score, reverse=True)
        return ordered[:top_k]

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

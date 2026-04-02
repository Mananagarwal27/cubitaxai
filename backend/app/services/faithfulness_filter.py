"""Post-generation faithfulness filter using RAGAS-style scoring."""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


class FaithfulnessFilter:
    """Check generated answers against retrieved context for factual consistency.

    Uses a lightweight LLM-based scoring approach when API keys are available,
    with a heuristic fallback for local development.
    """

    THRESHOLD = 0.75

    async def score(
        self,
        query: str,
        answer: str,
        context_chunks: list[dict[str, Any]],
    ) -> float:
        """Score the faithfulness of an answer against source context.

        Returns a float between 0.0 and 1.0. Higher = more faithful.
        """
        if not context_chunks or not answer:
            return 0.3

        try:
            from langchain_openai import ChatOpenAI
            from app.services.embedder import _has_real_api_key

            if not _has_real_api_key(settings.openai_api_key):
                return self._heuristic_score(answer, context_chunks)

            llm = ChatOpenAI(
                model="gpt-4o-mini",
                api_key=settings.openai_api_key,
                temperature=0,
            )

            context_text = "\n\n".join(
                chunk.get("text", "")[:500] for chunk in context_chunks[:5]
            )

            prompt = f"""You are a faithfulness evaluator. Given a CONTEXT and an ANSWER, score how 
faithfully the answer represents the context on a scale of 0.0 to 1.0.

Score 1.0: Every claim in the answer is directly supported by the context.
Score 0.5: Some claims are supported, others are inferred or added.
Score 0.0: The answer contradicts the context or is entirely unsupported.

CONTEXT:
{context_text}

ANSWER:
{answer}

Return ONLY a JSON object: {{"score": 0.XX, "reason": "brief explanation"}}"""

            response = await llm.ainvoke(prompt)
            try:
                result = json.loads(response.content)
                score = float(result.get("score", 0.5))
                logger.info(
                    "Faithfulness score: %.2f — %s",
                    score,
                    result.get("reason", "no reason"),
                )
                return max(0.0, min(1.0, score))
            except (json.JSONDecodeError, ValueError):
                return self._heuristic_score(answer, context_chunks)

        except Exception as exc:
            logger.warning("LLM faithfulness scoring failed: %s", exc)
            return self._heuristic_score(answer, context_chunks)

    @staticmethod
    def _heuristic_score(answer: str, context_chunks: list[dict[str, Any]]) -> float:
        """Fast heuristic faithfulness score based on term overlap."""
        answer_terms = set(answer.lower().split())
        context_terms: set[str] = set()
        for chunk in context_chunks:
            context_terms.update(chunk.get("text", "").lower().split())

        if not answer_terms:
            return 0.3

        overlap = len(answer_terms & context_terms)
        ratio = overlap / len(answer_terms)
        return min(1.0, 0.3 + ratio * 0.7)

    def should_retry(self, score: float) -> bool:
        """Determine if the answer should be retried based on the faithfulness score."""
        return score < self.THRESHOLD

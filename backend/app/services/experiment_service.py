"""A/B testing service for retrieval strategy experiments."""

from __future__ import annotations

import logging
import random
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.experiment import ExperimentFlag, QueryLog

logger = logging.getLogger(__name__)


class ExperimentService:
    """Manage feature flags for A/B testing and log query metrics."""

    async def get_variant(self, experiment_name: str, user_id: str) -> str:
        """Get or assign an experiment variant for a user.

        50/50 split between 'control' and 'treatment' variants.
        Once assigned, the variant persists for the user.
        """
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(ExperimentFlag).where(
                    ExperimentFlag.name == experiment_name,
                    ExperimentFlag.user_id == user_id,
                    ExperimentFlag.is_active == True,
                )
            )
            flag = result.scalar_one_or_none()
            if flag:
                return flag.variant

            variant = random.choice(["control", "treatment"])
            flag = ExperimentFlag(
                name=experiment_name,
                variant=variant,
                user_id=user_id,
            )
            session.add(flag)
            await session.commit()
            return variant

    async def log_query(
        self,
        user_id: str,
        query: str,
        query_type: str,
        strategy: str,
        bm25_weight: float,
        dense_weight: float,
        retrieval_latency_ms: float | None = None,
        generation_latency_ms: float | None = None,
        faithfulness_score: float | None = None,
    ) -> None:
        """Log a query with its retrieval strategy and metrics."""
        async with AsyncSessionLocal() as session:
            log = QueryLog(
                user_id=user_id,
                query=query,
                query_type=query_type,
                strategy_used=strategy,
                bm25_weight=bm25_weight,
                dense_weight=dense_weight,
                retrieval_latency_ms=retrieval_latency_ms,
                generation_latency_ms=generation_latency_ms,
                faithfulness_score=faithfulness_score,
            )
            session.add(log)
            await session.commit()

    async def get_metrics_summary(self) -> dict[str, Any]:
        """Compute aggregate metrics from query logs."""
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(QueryLog))
            logs = result.scalars().all()

            if not logs:
                return {"total_queries": 0}

            faithfulness_scores = [l.faithfulness_score for l in logs if l.faithfulness_score]
            retrieval_latencies = [l.retrieval_latency_ms for l in logs if l.retrieval_latency_ms]
            corrections = sum(1 for l in logs if l.follow_up_correction)

            return {
                "total_queries": len(logs),
                "avg_faithfulness": sum(faithfulness_scores) / len(faithfulness_scores) if faithfulness_scores else 0,
                "avg_retrieval_latency_ms": sum(retrieval_latencies) / len(retrieval_latencies) if retrieval_latencies else 0,
                "correction_rate": corrections / len(logs) if logs else 0,
                "strategy_distribution": {
                    strategy: sum(1 for l in logs if l.strategy_used == strategy)
                    for strategy in set(l.strategy_used for l in logs)
                },
            }

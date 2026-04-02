"""Prometheus-compatible metrics endpoint and collectors."""

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

router = APIRouter()

# ── In-process metrics store (lightweight alternative to prometheus_client) ──

_metrics: dict[str, Any] = {
    "counters": {
        "total_queries": 0,
        "total_uploads": 0,
        "total_llm_calls": 0,
        "total_retrieval_calls": 0,
        "circuit_breaker_trips": 0,
        "auth_failures": 0,
        "rate_limit_hits": 0,
    },
    "histograms": {
        "query_latency_seconds": [],
        "retrieval_latency_seconds": [],
        "generation_latency_seconds": [],
    },
    "gauges": {
        "active_sessions": 0,
        "token_usage_total": 0,
    },
    "per_org": {},
}


def increment_counter(name: str, amount: int = 1, org_id: str | None = None) -> None:
    """Increment a named counter metric."""
    _metrics["counters"][name] = _metrics["counters"].get(name, 0) + amount
    if org_id:
        org_metrics = _metrics["per_org"].setdefault(org_id, {"counters": {}, "token_usage": 0})
        org_metrics["counters"][name] = org_metrics["counters"].get(name, 0) + amount


def record_histogram(name: str, value: float) -> None:
    """Record a value in a histogram metric. Keeps last 1000 samples."""
    bucket = _metrics["histograms"].setdefault(name, [])
    bucket.append(value)
    if len(bucket) > 1000:
        _metrics["histograms"][name] = bucket[-1000:]


def set_gauge(name: str, value: float) -> None:
    """Set a gauge metric to a specific value."""
    _metrics["gauges"][name] = value


def record_token_usage(org_id: str, tokens: int) -> None:
    """Record token usage for an organization."""
    _metrics["gauges"]["token_usage_total"] = _metrics["gauges"].get("token_usage_total", 0) + tokens
    org_metrics = _metrics["per_org"].setdefault(org_id, {"counters": {}, "token_usage": 0})
    org_metrics["token_usage"] += tokens


def _percentile(data: list[float], p: float) -> float:
    """Calculate the p-th percentile of a float list."""
    if not data:
        return 0.0
    sorted_data = sorted(data)
    k = (len(sorted_data) - 1) * p
    f = int(k)
    c = f + 1
    if c >= len(sorted_data):
        return sorted_data[-1]
    return sorted_data[f] + (k - f) * (sorted_data[c] - sorted_data[f])


@router.get("/metrics")
async def get_metrics() -> Response:
    """Return Prometheus-compatible text metrics."""
    lines: list[str] = []

    for name, value in _metrics["counters"].items():
        lines.append(f"# TYPE cubitax_{name} counter")
        lines.append(f"cubitax_{name} {value}")

    for name, values in _metrics["histograms"].items():
        if values:
            lines.append(f"# TYPE cubitax_{name} summary")
            lines.append(f'cubitax_{name}{{quantile="0.5"}} {_percentile(values, 0.50):.4f}')
            lines.append(f'cubitax_{name}{{quantile="0.95"}} {_percentile(values, 0.95):.4f}')
            lines.append(f'cubitax_{name}{{quantile="0.99"}} {_percentile(values, 0.99):.4f}')
            lines.append(f"cubitax_{name}_count {len(values)}")

    for name, value in _metrics["gauges"].items():
        lines.append(f"# TYPE cubitax_{name} gauge")
        lines.append(f"cubitax_{name} {value}")

    for org_id, org_data in _metrics["per_org"].items():
        lines.append(f'cubitax_org_token_usage{{org="{org_id}"}} {org_data.get("token_usage", 0)}')

    return Response(content="\n".join(lines) + "\n", media_type="text/plain; charset=utf-8")


class MetricsMiddleware(BaseHTTPMiddleware):
    """Record request latency for all API endpoints."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start

        if request.url.path.startswith("/api/chat"):
            record_histogram("query_latency_seconds", duration)
            increment_counter("total_queries")

        return response

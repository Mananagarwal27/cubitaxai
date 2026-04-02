"""OpenTelemetry tracing for LangGraph agent steps and HTTP requests."""

from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Any, Generator

logger = logging.getLogger(__name__)

_tracer = None


def init_tracing(service_name: str = "cubitaxai-api") -> None:
    """Initialize OpenTelemetry with OTLP exporter or console fallback."""
    global _tracer

    try:
        from opentelemetry import trace
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import (
            BatchSpanProcessor,
            ConsoleSpanExporter,
        )

        resource = Resource.create({"service.name": service_name, "service.version": "2.0.0"})
        provider = TracerProvider(resource=resource)

        try:
            from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
            provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
        except Exception:
            provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))

        trace.set_tracer_provider(provider)
        _tracer = trace.get_tracer(__name__)
        logger.info("OpenTelemetry tracing initialized for %s", service_name)

    except ImportError:
        logger.warning("OpenTelemetry SDK not installed, tracing disabled")


def get_tracer():
    """Return the global tracer instance."""
    return _tracer


@contextmanager
def trace_agent_step(step_name: str, attributes: dict[str, Any] | None = None) -> Generator[Any, None, None]:
    """Context manager that wraps a LangGraph agent step in a trace span.

    Usage:
        with trace_agent_step("retriever_node", {"query": query}):
            # do retrieval
    """
    if _tracer:
        with _tracer.start_as_current_span(step_name) as span:
            if attributes:
                for key, value in attributes.items():
                    span.set_attribute(key, str(value))
            yield span
    else:
        yield None


def instrument_fastapi(app) -> None:
    """Add OpenTelemetry auto-instrumentation to the FastAPI app."""
    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        FastAPIInstrumentor.instrument_app(app)
        logger.info("FastAPI OpenTelemetry instrumentation enabled")
    except ImportError:
        logger.warning("FastAPI OTel instrumentation not available")

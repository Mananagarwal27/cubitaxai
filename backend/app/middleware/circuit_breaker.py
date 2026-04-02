"""Circuit breaker pattern for external LLM API calls."""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CircuitState(str, Enum):
    """Circuit breaker states."""

    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreaker:
    """Circuit breaker for LLM API calls with configurable thresholds.

    When CLOSED: normal operation, counting consecutive failures.
    When OPEN: all calls fail fast with degradation message.
    When HALF_OPEN: allows one test call to determine if service has recovered.
    """

    name: str = "llm_circuit"
    fail_max: int = 3
    reset_timeout: float = 60.0
    _state: CircuitState = field(default=CircuitState.CLOSED, init=False)
    _failure_count: int = field(default=0, init=False)
    _last_failure_time: float = field(default=0.0, init=False)
    _last_success_time: float = field(default=0.0, init=False)

    @property
    def state(self) -> CircuitState:
        """Return current circuit state, transitioning from OPEN to HALF_OPEN when timeout expires."""
        if self._state == CircuitState.OPEN:
            if time.time() - self._last_failure_time >= self.reset_timeout:
                logger.info("Circuit '%s' transitioning from OPEN to HALF_OPEN", self.name)
                self._state = CircuitState.HALF_OPEN
        return self._state

    def record_success(self) -> None:
        """Record a successful call and reset the circuit."""
        self._failure_count = 0
        self._last_success_time = time.time()
        if self._state != CircuitState.CLOSED:
            logger.info("Circuit '%s' recovered, moving to CLOSED", self.name)
            self._state = CircuitState.CLOSED

    def record_failure(self) -> None:
        """Record a failure and potentially trip the circuit."""
        self._failure_count += 1
        self._last_failure_time = time.time()
        if self._failure_count >= self.fail_max:
            logger.warning(
                "Circuit '%s' tripped after %d consecutive failures, moving to OPEN",
                self.name,
                self._failure_count,
            )
            self._state = CircuitState.OPEN

    async def call(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        """Execute a function through the circuit breaker.

        Args:
            func: Async callable to execute.
            *args: Positional arguments for the callable.
            **kwargs: Keyword arguments for the callable.

        Returns:
            The result of the callable if the circuit is closed/half-open and the call succeeds.

        Raises:
            CircuitBreakerOpen: If the circuit is open and the call is rejected.
        """
        current_state = self.state

        if current_state == CircuitState.OPEN:
            raise CircuitBreakerOpen(
                f"Circuit '{self.name}' is OPEN. LLM service unavailable. "
                f"Will retry in {self.reset_timeout - (time.time() - self._last_failure_time):.0f}s."
            )

        try:
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            self.record_success()
            return result
        except Exception as exc:
            self.record_failure()
            raise

    def get_status(self) -> dict[str, Any]:
        """Return circuit breaker status for health checks."""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self._failure_count,
            "fail_max": self.fail_max,
            "reset_timeout_seconds": self.reset_timeout,
        }


class CircuitBreakerOpen(Exception):
    """Raised when a call is rejected because the circuit is open."""


# Singleton circuit breakers for different LLM providers
llm_circuit = CircuitBreaker(name="openai", fail_max=3, reset_timeout=60.0)
embedding_circuit = CircuitBreaker(name="embeddings", fail_max=5, reset_timeout=30.0)
reranker_circuit = CircuitBreaker(name="reranker", fail_max=3, reset_timeout=45.0)

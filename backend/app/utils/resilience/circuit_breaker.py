"""
Módulo de Resiliência Distribuída (Circuit Breaker)
Padrão Enterprise / Big Tech para isolamento de falhas em dependências externas.
Implementa máquina de estados: CLOSED -> OPEN -> HALF-OPEN -> CLOSED.
"""

import time
import threading
from typing import Callable, Any, Optional, Dict

class CircuitBreakerOpenException(Exception):
    """Exceção levantada quando o disjuntor está aberto e bloqueia chamadas externas."""
    def __init__(self, circuit_name: str, retry_after: float):
        super().__init__(f"Circuit breaker '{circuit_name}' is OPEN. Retry after {retry_after:.1f}s.")
        self.circuit_name = circuit_name
        self.retry_after = retry_after

class CircuitBreaker:
    STATE_CLOSED = "CLOSED"
    STATE_OPEN = "OPEN"
    STATE_HALF_OPEN = "HALF_OPEN"

    def __init__(
        self,
        name: str,
        failure_threshold: int = 3,
        recovery_timeout: float = 30.0,
        half_open_success_threshold: int = 2,
        fallback: Optional[Callable[..., Any]] = None
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_success_threshold = half_open_success_threshold
        self.fallback = fallback

        self.state = self.STATE_CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = 0.0
        self.last_state_change = time.time()
        self._lock = threading.Lock()

    def call(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        with self._lock:
            current_time = time.time()

            # Transição OPEN -> HALF-OPEN após recovery_timeout
            if self.state == self.STATE_OPEN:
                if current_time - self.last_failure_time >= self.recovery_timeout:
                    self.state = self.STATE_HALF_OPEN
                    self.success_count = 0
                    self.last_state_change = current_time
                else:
                    retry_after = self.recovery_timeout - (current_time - self.last_failure_time)
                    if self.fallback:
                        return self.fallback(*args, **kwargs)
                    raise CircuitBreakerOpenException(self.name, retry_after)

        # Execução da chamada
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as exc:
            self._on_failure()
            if self.fallback:
                return self.fallback(*args, **kwargs)
            raise exc

    def _on_success(self) -> None:
        with self._lock:
            if self.state == self.STATE_HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.half_open_success_threshold:
                    self.state = self.STATE_CLOSED
                    self.failure_count = 0
                    self.success_count = 0
                    self.last_state_change = time.time()
            elif self.state == self.STATE_CLOSED:
                self.failure_count = 0

    def _on_failure(self) -> None:
        with self._lock:
            current_time = time.time()
            self.last_failure_time = current_time
            self.failure_count += 1

            if self.state in (self.STATE_CLOSED, self.STATE_HALF_OPEN):
                if self.failure_count >= self.failure_threshold or self.state == self.STATE_HALF_OPEN:
                    self.state = self.STATE_OPEN
                    self.last_state_change = current_time

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "name": self.name,
                "state": self.state,
                "failure_count": self.failure_count,
                "success_count": self.success_count,
                "last_failure_time": self.last_failure_time,
                "last_state_change": self.last_state_change,
            }

    def reset(self) -> None:
        with self._lock:
            self.state = self.STATE_CLOSED
            self.failure_count = 0
            self.success_count = 0
            self.last_failure_time = 0.0
            self.last_state_change = time.time()


class CircuitBreakerRegistry:
    """Registro global singleton para monitoramento e telemetria de todos os Circuit Breakers."""
    _instances: Dict[str, CircuitBreaker] = {}
    _lock = threading.Lock()

    @classmethod
    def get_or_create(cls, name: str, **kwargs: Any) -> CircuitBreaker:
        with cls._lock:
            if name not in cls._instances:
                cls._instances[name] = CircuitBreaker(name=name, **kwargs)
            return cls._instances[name]

    @classmethod
    def get_all_status(cls) -> Dict[str, Dict[str, Any]]:
        with cls._lock:
            return {name: cb.get_status() for name, cb in cls._instances.items()}

    @classmethod
    def reset_all(cls) -> None:
        with cls._lock:
            for cb in cls._instances.values():
                cb.reset()

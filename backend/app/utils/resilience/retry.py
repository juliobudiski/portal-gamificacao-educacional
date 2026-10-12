"""
Módulo de Retry com Exponential Backoff e Full Jitter
Mitiga sobrecarga em sistemas dependentes e previne efeito manada (Thundering Herd).
"""

import time
import random
import logging
from typing import Callable, Any, Tuple, Type

logger = logging.getLogger(__name__)

def retry_with_backoff(
    func: Callable[..., Any],
    *args: Any,
    max_retries: int = 3,
    base_delay: float = 0.5,
    max_delay: float = 5.0,
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
    **kwargs: Any
) -> Any:
    """
    Executa uma função com repetições baseadas em Full Jitter:
    delay = uniform(0, min(max_delay, base_delay * (2 ** attempt)))
    """
    attempt = 0
    while True:
        try:
            return func(*args, **kwargs)
        except retryable_exceptions as exc:
            attempt += 1
            if attempt > max_retries:
                logger.error(f"[Retry Exhausted] Falha após {attempt} tentativas: {exc}")
                raise exc

            # Algoritmo de Full Jitter recomendado pela AWS/Google SRE
            upper_bound = min(max_delay, base_delay * (2 ** (attempt - 1)))
            sleep_duration = random.uniform(0, upper_bound)
            logger.warning(
                f"[Retry Attempt {attempt}/{max_retries}] Erro: {exc}. Aguardando {sleep_duration:.2f}s com jitter..."
            )
            time.sleep(sleep_duration)

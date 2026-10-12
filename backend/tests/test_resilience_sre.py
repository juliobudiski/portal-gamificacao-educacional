"""
Testes Automatizados para a Camada de Resiliência Distribuída (SRE)
Cobre Circuit Breaker, Idempotência com Replay Headers e Deep Health Check.
"""

import time
import json
import pytest
from app.utils.resilience.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerOpenException,
    CircuitBreakerRegistry
)
from app.utils.resilience.retry import retry_with_backoff

class TestCircuitBreaker:
    def test_circuit_breaker_transitions_closed_to_open_and_half_open(self):
        cb = CircuitBreaker(
            name="test_gateway",
            failure_threshold=2,
            recovery_timeout=0.2,
            half_open_success_threshold=1
        )

        def failing_call():
            raise ConnectionError("Serviço externo indisponível")

        def successful_call():
            return "SUCCESS"

        # 1. Estado inicial CLOSED
        assert cb.state == CircuitBreaker.STATE_CLOSED

        # 2. Primeira falha
        with pytest.raises(ConnectionError):
            cb.call(failing_call)
        assert cb.state == CircuitBreaker.STATE_CLOSED
        assert cb.failure_count == 1

        # 3. Segunda falha atinge o threshold (2) -> transição para OPEN
        with pytest.raises(ConnectionError):
            cb.call(failing_call)
        assert cb.state == CircuitBreaker.STATE_OPEN

        # 4. Chamada imediata é barrada sem executar a função
        with pytest.raises(CircuitBreakerOpenException) as exc_info:
            cb.call(successful_call)
        assert "is OPEN" in str(exc_info.value)

        # 5. Espera passar o recovery_timeout (0.2s) para entrar em HALF-OPEN
        time.sleep(0.25)
        # Próxima chamada deve ser executada em teste e, se passar, voltar para CLOSED
        result = cb.call(successful_call)
        assert result == "SUCCESS"
        assert cb.state == CircuitBreaker.STATE_CLOSED
        assert cb.failure_count == 0

    def test_circuit_breaker_fallback(self):
        cb = CircuitBreaker(
            name="fallback_test",
            failure_threshold=1,
            fallback=lambda: "FALLBACK_VALUE"
        )
        def failing():
            raise TimeoutError("timeout")

        # Ao falhar, retorna o fallback sem propagar exceção
        result = cb.call(failing)
        assert result == "FALLBACK_VALUE"
        assert cb.state == CircuitBreaker.STATE_OPEN

        # Aberto, continua retornando fallback
        result_open = cb.call(failing)
        assert result_open == "FALLBACK_VALUE"


class TestRetryBackoff:
    def test_retry_eventually_succeeds(self):
        attempts = 0
        def unstable_operation():
            nonlocal attempts
            attempts += 1
            if attempts < 3:
                raise ConnectionResetError("Flaky connection")
            return "RESOLVED"

        result = retry_with_backoff(unstable_operation, max_retries=3, base_delay=0.01)
        assert result == "RESOLVED"
        assert attempts == 3

    def test_retry_exhausted_raises(self):
        attempts = 0
        def permanently_broken():
            nonlocal attempts
            attempts += 1
            raise RuntimeError("Permanent error")

        with pytest.raises(RuntimeError):
            retry_with_backoff(permanently_broken, max_retries=2, base_delay=0.01)
        assert attempts == 3  # initial + 2 retries


class TestIdempotencyAndHealthProbe:
    def test_idempotent_request_replay(self, client):
        """
        Valida que requisições com Idempotency-Key repetidas:
        - Não criam registros duplicados no banco
        - Retornam status idêntico com o header X-Idempotent-Replay: true
        """
        idempotency_key = "idemp-unique-token-test-123"
        payload = {
            "name": "Maria Teste",
            "email": "maria@teste.com",
            "subject": "Contato Idempotente",
            "message": "Mensagem enviada com chave de idempotência."
        }

        # Primeira requisição: execução normal
        res1 = client.post(
            "/api/contact",
            data=json.dumps(payload),
            headers={"Content-Type": "application/json", "Idempotency-Key": idempotency_key}
        )
        assert res1.status_code == 201
        assert res1.headers.get("X-Idempotent-Replay") == "false"
        data1 = res1.get_json()
        assert "id" in data1

        # Segunda requisição imediata com a mesma chave: REPLAY
        res2 = client.post(
            "/api/contact",
            data=json.dumps(payload),
            headers={"Content-Type": "application/json", "Idempotency-Key": idempotency_key}
        )
        assert res2.status_code == 201
        assert res2.headers.get("X-Idempotent-Replay") == "true"
        data2 = res2.get_json()
        assert data2["id"] == data1["id"]

    def test_deep_health_check_probe(self, client):
        """Valida que /api/health retorna métricas de latência SQL e status dos Circuit Breakers."""
        # Registra um disjuntor de teste
        CircuitBreakerRegistry.get_or_create("email_gateway")

        res = client.get("/api/health")
        assert res.status_code == 200
        data = res.get_json()

        assert data["status"] == "UP"
        assert data["database"]["status"] == "CONNECTED"
        assert isinstance(data["database"]["latency_ms"], (int, float))
        assert "circuit_breakers" in data
        assert "email_gateway" in data["circuit_breakers"]
        assert data["circuit_breakers"]["email_gateway"]["state"] == "CLOSED"

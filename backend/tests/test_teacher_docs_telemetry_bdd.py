"""
Testes BDD (Given / When / Then) — US-26 / RF-16:
Telemetria Científica e Contratos de Segurança para a Central de Documentação Docente & FAQ.
Valida:
1. Caminho Feliz: Registro de leitura de guia, busca sanitizada e voto de utilidade ('helpful_vote') no EventLog.
2. Caminho Alternativo: Registro em lote (batch) de interações no FAQ docente.
3. Exceção: Bloqueio 401 Unauthorized para requisições sem JWT e 400 Bad Request para eventos incompletos.
4. Chaos Monkey: Preservação transacional (rollback seguro / não corrupção) sob payloads malformados.
"""

import json
from app.models import EventLog


class TestTeacherDocsTelemetryContractsBDD:
    def test_given_authenticated_professor_when_voting_article_helpfulness_then_persists_event_201(
        self, client, professor_auth_headers
    ):
        """
        GIVEN: Um professor autenticado consultando um artigo na Central de Documentação Docente
        WHEN: Envia um micro-feedback de utilidade ("Este artigo ajudou? Sim") via POST /api/log/event
        THEN: O evento é persistido na tabela EventLog com status 201 Created e metadados íntegros
        """
        payload = {
            "section": "teacher_docs",
            "action": "article_helpful_vote",
            "details": {
                "category_slug": "motor-mdc-hexad",
                "article_slug": "vetos-pedagogicos-dark-side",
                "helpful": True
            }
        }
        response = client.post(
            "/api/log/event",
            data=json.dumps(payload),
            headers=professor_auth_headers
        )
        assert response.status_code == 201
        body = response.get_json()
        assert "1 evento(s) registrado(s)" in body.get("message", "")

        saved_event = EventLog.query.filter_by(
            section="teacher_docs",
            action="article_helpful_vote"
        ).first()
        assert saved_event is not None
        assert saved_event.details["article_slug"] == "vetos-pedagogicos-dark-side"
        assert saved_event.details["helpful"] is True

    def test_given_authenticated_professor_when_sending_batch_docs_and_faq_telemetry_then_returns_201(
        self, client, professor_auth_headers
    ):
        """
        GIVEN: Um professor navegando entre a busca Ctrl+K e itens do FAQ
        WHEN: O cliente despacha um lote (batch) de eventos analíticos sanitizados
        THEN: Todos os eventos do lote são gravados atomicamente com status 201
        """
        batch_payload = {
            "events": [
                {
                    "section": "teacher_docs",
                    "action": "docs_search_executed",
                    "details": {"query": "roleta moedas xp", "hits": 4}
                },
                {
                    "section": "teacher_docs",
                    "action": "faq_item_expanded",
                    "details": {"faq_id": "faq-xp-vs-coins"}
                }
            ]
        }
        response = client.post(
            "/api/log/event",
            data=json.dumps(batch_payload),
            headers=professor_auth_headers
        )
        assert response.status_code == 201
        assert "2 evento(s) registrado(s)" in response.get_json().get("message", "")

    def test_given_anonymous_visitor_when_posting_docs_telemetry_then_returns_401(self, client):
        """
        GIVEN: Um visitante não autenticado sem token JWT
        WHEN: Tenta registrar eventos na rota de telemetria docente
        THEN: O backend rejeita com 401 Unauthorized (RNF-01)
        """
        payload = {
            "section": "teacher_docs",
            "action": "article_view",
            "details": {"article_slug": "primeira-atividade-5-minutos"}
        }
        response = client.post(
            "/api/log/event",
            data=json.dumps(payload),
            content_type="application/json"
        )
        assert response.status_code == 401

    def test_given_malformed_telemetry_payload_without_action_then_returns_400_without_orphan_rows(
        self, client, professor_auth_headers
    ):
        """
        GIVEN: Um payload corrompido (Chaos Monkey) ausente do campo obrigatório 'action' em um batch
        WHEN: Submetido ao endpoint /api/log/event
        THEN: Retorna 400 Bad Request e não persiste eventos parciais órfãos do lote inválido
        """
        count_before = EventLog.query.filter_by(section="teacher_docs_chaos").count()
        corrupted_batch = {
            "events": [
                {"section": "teacher_docs_chaos", "action": "valid_step", "details": {}},
                {"section": "teacher_docs_chaos", "details": {"broken": True}}
            ]
        }
        response = client.post(
            "/api/log/event",
            data=json.dumps(corrupted_batch),
            headers=professor_auth_headers
        )
        assert response.status_code == 400
        count_after = EventLog.query.filter_by(section="teacher_docs_chaos").count()
        assert count_after == count_before

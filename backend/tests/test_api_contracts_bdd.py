"""
Testes de Contratos de API, BDD (Given / When / Then) e Segurança RBAC
Valida status codes, estruturas JSON, permissões de perfis e acesso não autorizado.
"""

import json
import pytest
from app.models import Class, Enrollment

class TestAuthAndRBACContractsBDD:
    def test_given_anonymous_user_when_accessing_protected_route_then_returns_401(self, client):
        """
        GIVEN: Um usuário anônimo sem credenciais
        WHEN: Tenta acessar uma rota protegida de turmas
        THEN: O sistema bloqueia com 401 Unauthorized
        """
        response = client.get("/api/classes")
        assert response.status_code == 401

    def test_given_student_when_attempting_to_create_class_then_returns_403(self, client, student_auth_headers):
        """
        GIVEN: Um usuário autenticado com perfil 'aluno'
        WHEN: Tenta criar uma turma (ação exclusiva de professor)
        THEN: O sistema bloqueia com 403 Forbidden
        """
        payload = {"name": "Turma Hacker", "description": "Tentativa não autorizada"}
        response = client.post(
            "/api/classes",
            data=json.dumps(payload),
            headers=student_auth_headers
        )
        assert response.status_code == 403
        data = response.get_json()
        assert "Apenas professores" in data.get("message", "")

    def test_given_professor_when_creating_class_then_returns_201_with_enrollment_code(self, client, professor_auth_headers):
        """
        GIVEN: Um professor autenticado
        WHEN: Envia os dados para criação de uma nova turma
        THEN: A turma é criada com sucesso (201) e recebe um código de inscrição único
        """
        payload = {"name": "Arquitetura de Software II", "description": "Turma de engenharia"}
        response = client.post(
            "/api/classes",
            data=json.dumps(payload),
            headers=professor_auth_headers
        )
        assert response.status_code == 201
        data = response.get_json()
        assert "class" in data
        class_obj = data["class"]
        assert "id" in class_obj
        assert "enrollment_code" in class_obj
        assert len(class_obj["enrollment_code"]) > 0

    def test_given_student_when_joining_valid_class_then_returns_201(
        self, client, professor_auth_headers, student_auth_headers
    ):
        """
        GIVEN: Uma turma criada por um professor e um aluno autenticado
        WHEN: O aluno envia o código de inscrição da turma
        THEN: O aluno é matriculado na turma com sucesso
        """
        # 1. Professor cria a turma
        create_res = client.post(
            "/api/classes",
            data=json.dumps({"name": "Matemática Gamificada", "description": "Ensino médio"}),
            headers=professor_auth_headers
        )
        assert create_res.status_code == 201
        enrollment_code = create_res.get_json()["class"]["enrollment_code"]

        # 2. Aluno ingressa na turma
        join_res = client.post(
            "/api/classes/join",
            data=json.dumps({"enrollment_code": enrollment_code}),
            headers=student_auth_headers
        )
        assert join_res.status_code == 201
        data = join_res.get_json()
        assert data.get("class", {}).get("enrollment_code") == enrollment_code

        # 3. Aluno tenta entrar novamente: deve retornar 409 Conflict
        rejoin_res = client.post(
            "/api/classes/join",
            data=json.dumps({"enrollment_code": enrollment_code}),
            headers=student_auth_headers
        )
        assert rejoin_res.status_code == 409


class TestPublicApiContractsBDD:
    def test_given_public_stats_request_then_returns_200_and_metrics_payload(self, client):
        """
        GIVEN: Qualquer visitante público
        WHEN: Acessa o endpoint /api/public/stats
        THEN: Retorna status 200 com métricas da plataforma
        """
        response = client.get("/api/public/stats")
        assert response.status_code == 200
        data = response.get_json()
        assert "users" in data
        assert "students" in data
        assert "professors" in data
        assert "activities" in data
        assert "classes" in data

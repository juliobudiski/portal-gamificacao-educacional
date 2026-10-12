"""
Suíte de Testes Automatizados para:
1. Recommendation Engine (Motor Heurístico MUI e SWEBOK)
   - Contratos e validação de schema Pydantic
   - Classificação semântica de objetivos
   - Fronteira de decisão algébrica e normalização
   - Vetos algorítmicos e vetos logísticos (ex: atividade desplugada barrando digitais)
   - Partição de retorno em recommended, neutral e not_recommended
2. Ciclo de Vida de Criação da Atividade Gamificada (Activity Lifecycle)
   - Criação por professor com dados completos (Quizzes, Narrativas, Loja default, Tags)
   - Proibição de criação por aluno (RBAC 403)
   - Promoção de rascunho para oficial sem duplicação de dados
"""

import json
import pytest
from app.services.recommendation_engine import (
    ContextualRecommendationEngine,
    GameficaContextInput,
    SUBDOMAIN_TO_SWEBOK
)
from app.services.activity_service import create_activity
from app.models import Activity, QuizContent, NarrativeContent, StoreItem, Tag

class TestRecommendationEngine:
    @pytest.fixture
    def engine(self):
        return ContextualRecommendationEngine()

    def test_semantic_classification_of_objectives(self, engine):
        """Valida se o classificador semântico categoriza corretamente os textos dos objetivos."""
        # Palavras-chave teóricas
        teorico = engine._classify_objectives(["Desenvolver raciocínio lógico e leitura crítica"])
        assert "teorico" in teorico

        # Palavras-chave práticas
        pratico = engine._classify_objectives(["Fazer testes automatizados e depuração de código"])
        assert "pratico" in pratico

        # Palavras-chave colaborativas
        colab = engine._classify_objectives(["Trabalho em equipe usando scrum e debate"])
        assert "colaborativo" in colab

        # Fallback padrão quando texto genérico
        default_fallback = engine._classify_objectives(["Aprender conceito xyz"])
        assert default_fallback == ["pratico"]

    def test_recommendation_contract_and_structure(self, engine):
        """Valida se a estrutura de resposta segue rigorosamente o formato esperado pelo React."""
        payload = {
            "greatArea": "Ciências Exatas",
            "areaKnowledge": "engenharia de software e projetos",
            "subdomain": "engenharia de software e projetos",
            "currentScenario": {
                "problems": ["Falta de motivação dos alunos nos exercícios de design"]
            },
            "desiredScenario": {
                "objectives": ["Melhorar colaboração em equipe e resolução de problemas práticos"]
            },
            "playerProfile": {
                "selectedProfiles": ["Conquistador", "Socializador"]
            },
            "activityPlanning": {
                "characteristics": ["presencial", "individual"],
                "isTeamActivity": False
            }
        }

        result = engine.calculate_recommendations(payload)

        assert isinstance(result, dict)
        assert "recommended" in result
        assert "neutral" in result
        assert "not_recommended" in result

        # Verifica formato de cada item recomendado
        for item in result["recommended"]:
            assert "name" in item
            assert "score" in item
            assert isinstance(item["score"], (int, float))
            assert "reason" in item
            assert "pre_selected" in item

        # Verifica que scores são ordenados decrescentemente
        scores = [item["score"] for item in result["recommended"]]
        assert scores == sorted(scores, reverse=True)

    def test_logistics_veto_unplugged_blocks_digital_mechanics(self, engine):
        """
        Em atividades com a característica 'desplugado', mecânicas digitais
        (Chat, Fórum, Conquistas Digitais) devem sofrer veto logístico obrigatório
        e serem alocadas em 'not_recommended'.
        """
        payload = {
            "greatArea": "Computação",
            "areaKnowledge": "SOFTWARE CONSTRUCTION",
            "currentScenario": {"problems": ["Dificuldade de concentração"]},
            "desiredScenario": {"objectives": ["Compreensão de lógica"]},
            "playerProfile": {"selectedProfiles": ["Explorador"]},
            "activityPlanning": {
                "characteristics": ["atividade desplugada", "sem computadores"],
                "isTeamActivity": False
            }
        }

        result = engine.calculate_recommendations(payload)
        not_recommended_names = [item["name"] for item in result["not_recommended"]]

        # Mecânicas digitais devem estar vetadas
        assert "Chat ou sistema de mensagens" in not_recommended_names
        assert "Conquistas digitais para metas alcançadas" in not_recommended_names

    def test_invalid_payload_raises_value_error(self, engine):
        """Valida que payloads malformados falham com validação explícita."""
        with pytest.raises(ValueError) as excinfo:
            engine.calculate_recommendations({"currentScenario": "String invalida onde deveria ser dict"})
        assert "Payload inválido" in str(excinfo.value)


class TestActivityCreationLifecycle:
    def test_create_activity_success_with_quizzes_and_store(self, db_session, professor_user):
        """
        Valida o ciclo completo de criação de atividade gamificada:
        - Persistência de metadados principais
        - Extração de Quizzes para a tabela de QuizContent
        - Extração de Narrativas para a tabela de NarrativeContent
        - Povoamento automático da loja de cosméticos e itens
        - Associação de Tags
        """
        activity_payload = {
            "title": "Missão Clean Architecture",
            "description": "Atividade gamificada sobre desacoplamento e TDD",
            "areaKnowledge": "Engenharia de Software",
            "isPublic": True,
            "tags": ["Arquitetura", "TDD", "Qualidade"],
            "activityPlanning": {
                "isTeamActivity": False,
                "characteristics": ["presencial"]
            },
            "currentScenario": {"problems": ["Acoplamento excessivo"]},
            "desiredScenario": {"objectives": ["Desacoplar serviços"]},
            "playerProfile": {"selectedProfiles": ["Conquistador"]},
            "gamificationDesign": {
                "progression_path": [
                    {
                        "id": "step_1",
                        "title": "Passo 1: Entendendo o Domínio",
                        "content": {
                            "type": "narrative",
                            "scenario": "Sala de aula",
                            "characters": ["Instrutor Sênior"],
                            "dialogue": ["Bem-vindo ao desafio de Clean Architecture!"]
                        }
                    },
                    {
                        "id": "step_2",
                        "title": "Passo 2: Desafio de Testabilidade",
                        "content": {
                            "type": "quiz",
                            "questions": [
                                {
                                    "question": "Qual o benefício de testar com SQLite em memória?",
                                    "options": ["Velocidade e isolamento", "Lentidão", "Custo alto", "Nenhum"],
                                    "correct_answer": 0,
                                    "points": 50
                                }
                            ]
                        }
                    }
                ]
            }
        }

        # Criação da atividade pelo serviço
        response_data, status_code = create_activity(professor_user, activity_payload)

        assert status_code == 201
        assert "activity" in response_data
        created_activity = response_data["activity"]
        assert created_activity["id"] is not None
        assert created_activity["title"] == "Missão Clean Architecture"
        assert created_activity["is_draft"] is False
        assert created_activity["isPublic"] is True

        # Valida que tags foram persistidas
        stored_activity = Activity.query.get(created_activity["id"])
        tags_names = [t.name for t in stored_activity.tags]
        assert "Arquitetura" in tags_names
        assert "TDD" in tags_names

        # Valida que a loja default foi populada
        store_items = StoreItem.query.filter_by(activity_id=created_activity["id"]).all()
        assert len(store_items) > 0

        # Valida que o conteúdo de Quiz foi extraído para a tabela dedicada
        quizzes = QuizContent.query.filter_by(activity_id=created_activity["id"]).all()
        assert len(quizzes) == 1
        assert len(quizzes[0].questions) == 1
        assert quizzes[0].questions[0]["question"] == "Qual o benefício de testar com SQLite em memória?"

        # Valida que a narrativa foi extraída para a tabela dedicada
        narratives = NarrativeContent.query.filter_by(activity_id=created_activity["id"]).all()
        assert len(narratives) == 1
        assert "Bem-vindo ao desafio de Clean Architecture!" in narratives[0].dialogue

    def test_student_cannot_create_activity(self, db_session, student_user):
        """Garante que usuários com papel 'aluno' são proibidos de criar atividades (403 Forbidden)."""
        payload = {"title": "Atividade Proibida", "description": "Tentativa de aluno"}
        response, status_code = create_activity(student_user, payload)
        assert status_code == 403
        assert "Acesso negado" in response["message"]

    def test_promote_draft_to_official_without_duplication(self, db_session, professor_user):
        """
        Ao salvar uma atividade que já era um rascunho, o sistema deve:
        - Atualizar o registro existente
        - Limpar e recriar os conteúdos filhos sem duplicação
        - Manter is_draft = False
        """
        # Cria rascunho prévio
        draft = Activity(
            professor_id=professor_user.id,
            title="Rascunho Inicial",
            description="Versão rascunho",
            is_draft=True
        )
        db_session.add(draft)
        db_session.commit()
        draft_id = draft.id

        update_payload = {
            "id": draft_id,
            "title": "Atividade Promovida a Oficial",
            "description": "Agora oficial e pronta",
            "isPublic": False,
            "activityPlanning": {"isTeamActivity": True},
            "gamificationDesign": {
                "progression_path": [
                    {
                        "id": "step_quiz",
                        "content": {
                            "type": "quiz",
                            "questions": [{"question": "Q1", "options": ["A", "B"], "correct_answer": 0, "points": 10}]
                        }
                    }
                ]
            }
        }

        response_data, status_code = create_activity(professor_user, update_payload)

        assert status_code == 201
        assert "activity" in response_data
        updated_activity = response_data["activity"]
        assert updated_activity["id"] == draft_id
        assert updated_activity["is_draft"] is False
        assert updated_activity["title"] == "Atividade Promovida a Oficial"
        assert updated_activity["is_team_activity"] is True

        # Confirma que só existe 1 registro de Quiz associado
        quizzes = QuizContent.query.filter_by(activity_id=draft_id).all()
        assert len(quizzes) == 1

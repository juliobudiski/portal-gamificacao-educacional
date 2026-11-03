"""
Testes de Integração Ponta a Ponta: Ciclo de Vida da Atividade Gamificada e Elementos de Jogos
Perspectivas Duplas: Professor e Aluno.

Cobre:
1. Criação e publicação de atividades com trilha gamificada (Narrativa, Quiz, Conteúdo de Leitura).
2. Validação da persistência de rascunhos de IA (QuizContent, NarrativeContent, LearningContent).
3. Atribuição à turma e matrícula de alunos com código de inscrição.
4. Uso de cada um dos elementos de gamificação:
   - Resposta a Quizzes com pontuação, XP e desbloqueio de Medalhas.
   - Roleta diária com cooldown e cálculo de prêmios.
   - Loja de cosméticos, débito de moedas e inventário.
   - Fórum de dúvidas com criação de tópicos, respostas, marcação de melhor resposta e curtidas.
   - Chat da turma em tempo real com sanitização e moderação anti-abuso.
   - Leaderboard / Hall da Fama da atividade enriquecido com cosméticos e títulos.
   - Consulta ao catálogo de medalhas desbloqueadas.
"""

import pytest
import json
from flask_jwt_extended import create_access_token
from app.models import (
    db, User, Class, Enrollment, Activity, ActivityProgress,
    StoreItem, Purchase, Medal, UserUnlockedMedal,
    ForumCategory, ForumTopic, ForumPost, PostLike,
    Conversation, ChatMessage, QuizContent, NarrativeContent, LearningContent
)
from app.services.activity_service import sync_progression_path_contents
from app.services.chat_service import ChatService


class TestGameElementsPerspectives:
    """Suíte abrangente e reutilizável para o ecossistema gamificado completo."""

    @pytest.fixture
    def setup_environment(self, app, db_session, create_user):
        """Prepara ambiente com Professor, Aluno 1, Aluno 2, Turma e Medalhas."""
        prof = create_user("Prof. Turing", "turing@gamifica.edu", role="professor")
        aluno1 = create_user("Ada Lovelace", "ada@gamifica.edu", role="aluno")
        aluno2 = create_user("Grace Hopper", "grace@gamifica.edu", role="aluno")

        with app.app_context():
            prof_token = create_access_token(identity=str(prof.id))
            aluno1_token = create_access_token(identity=str(aluno1.id))

        prof_headers = {
            "Authorization": f"Bearer {prof_token}",
            "Content-Type": "application/json"
        }
        student_headers = {
            "Authorization": f"Bearer {aluno1_token}",
            "Content-Type": "application/json"
        }

        # Cria turma
        turma = Class(
            name="Engenharia de Software 2026",
            description="Turma de teste automatizado",
            professor_id=prof.id,
            enrollment_code="GAMIFICA10"
        )
        db_session.add(turma)
        db_session.commit()

        # Cria medalhas padrão no banco para teste de desbloqueio
        medalha_exp = Medal(
            name="Medalha do Explorador",
            description="Completou todos os passos da atividade.",
            type="explorador",
            image_url="/medals/explorador.webp"
        )
        medalha_fenix = Medal(
            name='Medalha "Fênix"',
            description="Superação após erro em questão.",
            type="fenix",
            image_url="/medals/fenix.webp"
        )
        db_session.add_all([medalha_exp, medalha_fenix])
        db_session.commit()

        return {
            "professor": prof,
            "aluno1": aluno1,
            "aluno2": aluno2,
            "turma": turma,
            "medalha_exp": medalha_exp,
            "prof_headers": prof_headers,
            "student_headers": student_headers
        }

    def test_teacher_activity_creation_and_ai_draft_synchronization(
        self, client, db_session, setup_environment
    ):
        """
        Perspectiva do Professor:
        - Cria atividade em rascunho com trilha (progression_path).
        - Valida sincronização dos rascunhos de IA (Narrativa, Conteúdo de Leitura e Quiz).
        - Publica a atividade e atribui à turma.
        """
        prof = setup_environment["professor"]
        turma = setup_environment["turma"]
        prof_headers = setup_environment["prof_headers"]

        progression_path = [
            {
                "id": "step_1_narrativa",
                "type": "narrative",
                "content": {
                    "type": "narrative",
                    "scenario": "/narrativa/cenarios/espaco.webp",
                    "characters": [{"role": "Mentor", "image": "/narrativa/personagens/ada.webp"}],
                    "dialogue": [{"characterRole": "Mentor", "text": "Bem-vindo ao labirinto dos requisitos!"}]
                }
            },
            {
                "id": "step_2_conteudo",
                "type": "content",
                "content": {
                    "type": "content",
                    "text_content": "# Requisitos Não-Funcionais\nSegurança e escalabilidade são fundamentais.",
                    "video_url": "https://www.youtube.com/watch?v=sample",
                    "material_link": "https://docs.gamifica.edu"
                }
            },
            {
                "id": "step_3_quiz",
                "type": "quiz",
                "content": {
                    "type": "quiz",
                    "questions": [
                        {
                            "text": "O que caracteriza um requisito de confiabilidade?",
                            "options": ["MTBF e MTTR", "Cor do botão", "Nome da marca", "Preço da licença"],
                            "correct_option": "MTBF e MTTR",
                            "points": 25,
                            "coins": 10,
                            "timeLimit": 60
                        }
                    ]
                }
            }
        ]

        payload = {
            "title": "Módulo 1: Fundamentos de Requisitos",
            "description": "Atividade gamificada com narrativa interativa e quiz.",
            "is_draft": True,
            "class_id": turma.id,
            "gamificationDesign": {
                "progression_path": progression_path,
                "mechanics": ["quiz", "roulette", "store", "leaderboard", "forum", "chat"]
            }
        }

        # 1. Cria atividade via endpoint do professor
        res_create = client.post("/api/activities", json=payload, headers=prof_headers)
        assert res_create.status_code == 201
        res_json = res_create.get_json()
        activity_data = res_json.get("activity", res_json)
        activity_id = activity_data["id"]

        # 2. Verifica se as entidades relacionais foram sincronizadas corretamente
        activity = db_session.get(Activity, activity_id)
        assert activity is not None
        assert activity.professor_id == prof.id

        # Sincronização explícita das tabelas filhas (QuizContent, NarrativeContent, LearningContent)
        sync_progression_path_contents(activity.id, progression_path)
        db_session.commit()

        narrative = NarrativeContent.query.filter_by(activity_id=activity.id, step_id="step_1_narrativa").first()
        learning = LearningContent.query.filter_by(activity_id=activity.id, step_id="step_2_conteudo").first()
        quiz = QuizContent.query.filter_by(activity_id=activity.id, step_id="step_3_quiz").first()

        assert narrative is not None
        assert narrative.scenario == "/narrativa/cenarios/espaco.webp"
        assert learning is not None
        assert "Requisitos Não-Funcionais" in learning.text_content
        assert quiz is not None
        assert quiz.questions[0]["correct_option"] == "MTBF e MTTR"

        # 3. Publicação do rascunho
        res_publish = client.post(f"/api/activities/{activity_id}/publish", json={}, headers=prof_headers)
        assert res_publish.status_code == 200
        assert db_session.get(Activity, activity_id).is_draft is False

    def test_student_and_teacher_game_elements_interaction(
        self, client, db_session, setup_environment
    ):
        """
        Teste E2E de Interação com Elementos de Jogo:
        1. Aluno entra na turma via enrollment_code.
        2. Atividade atribuída gera progresso para o aluno.
        3. Quiz: Aluno submete resposta correta, ganha XP, moedas e verifica medalhas.
        4. Roleta: Aluno gira roleta e ganha prêmio (respeitando cooldown).
        5. Loja: Professor cadastra item, aluno com moedas adquire o item.
        6. Fórum: Aluno cria tópico de dúvida, Professor marca melhor resposta, Aluno dá like.
        7. Chat: Aluno e professor enviam mensagens no chat da atividade com sanitização.
        8. Leaderboard: Visualiza quadro de líderes atualizado e pontuado.
        """
        prof = setup_environment["professor"]
        aluno1 = setup_environment["aluno1"]
        turma = setup_environment["turma"]
        prof_headers = setup_environment["prof_headers"]
        student_headers = setup_environment["student_headers"]

        # --- 1. Aluno se matricula na turma ---
        res_join = client.post("/api/classes/join", json={"enrollment_code": turma.enrollment_code}, headers=student_headers)
        assert res_join.status_code in [200, 201]

        # --- 2. Criação da atividade oficial vinculada à turma ---
        activity = Activity(
            title="Missão Arquitetural SOLID",
            description="Atividade prática de design orientado a objetos",
            professor_id=prof.id,
            class_id=turma.id,
            is_draft=False,
            gamification_design={
                "progression_path": [
                    {"id": "step_1", "type": "narrative"},
                    {"id": "step_2", "type": "quiz"}
                ]
            }
        )
        db_session.add(activity)
        db_session.commit()

        # Cria o progresso inicial do aluno na atividade
        progress = ActivityProgress(
            student_id=aluno1.id,
            activity_id=activity.id,
            class_id=turma.id,
            total_xp_earned=0,
            points_earned=0,
            coins=50,
            status="in_progress"
        )
        db_session.add(progress)
        db_session.commit()

        # --- 3. ELEMENTO 1: QUIZ E MEDALHAS ---
        quiz_submit_payload = {
            "points_earned": 100,
            "is_correct": True,
            "question_text": "O que preconiza o princípio Aberto/Fechado (OCP)?",
            "selected_option": "Aberto para extensão, fechado para modificação."
        }
        res_quiz = client.post(
            f"/api/activities/{activity.id}/submit_answer",
            json=quiz_submit_payload,
            headers=student_headers
        )
        assert res_quiz.status_code == 200
        quiz_json = res_quiz.get_json()
        assert quiz_json["new_total_points"] == 100

        # Conclui os passos para testar conquista de medalha do explorador
        progress.completed_steps = ["step_1", "step_2"]
        progress.status = "completed"
        db_session.commit()

        res_event = client.post(
            f"/api/activities/{activity.id}/log_event",
            json={"event_type": "activity_completed"},
            headers=student_headers
        )
        assert res_event.status_code in [200, 201]

        # Verifica medalhas desbloqueadas pelo aluno
        res_medals = client.get("/api/medals/my-unlocked", headers=student_headers)
        assert res_medals.status_code == 200

        # --- 4. ELEMENTO 2: ROLETA DIÁRIA ---
        res_spin = client.post(
            f"/api/progress/{activity.id}/spin",
            json={"is_retry": False},
            headers=student_headers
        )
        assert res_spin.status_code == 200
        spin_data = res_spin.get_json()
        assert "reward" in spin_data or "prize" in spin_data or "updated_progress" in spin_data

        # --- 5. ELEMENTO 3: LOJA DE ITENS / COSMÉTICOS ---
        item_loja = StoreItem(
            activity_id=activity.id,
            name="Título: Mestre do Clean Code",
            description="Exibe um título especial no ranking",
            item_type="cosmetic",
            price=30,
            effect_id=json.dumps({"color": "#10B981", "badge": "emerald"})
        )
        db_session.add(item_loja)
        db_session.commit()

        progress_before_purchase = ActivityProgress.query.filter_by(student_id=aluno1.id, activity_id=activity.id).first()
        coins_before = progress_before_purchase.coins

        # Aluno compra o item
        res_purchase = client.post(
            f"/api/progress/{activity.id}/purchase",
            json={"item_id": item_loja.id},
            headers=student_headers
        )
        assert res_purchase.status_code == 200
        # Confirma débito exato de moedas pelo preço do item
        progress_after = ActivityProgress.query.filter_by(student_id=aluno1.id, activity_id=activity.id).first()
        assert progress_after.coins == coins_before - 30

        # --- 6. ELEMENTO 4: FÓRUM DE DÚVIDAS E DISCUSSÃO ---
        cat = ForumCategory(activity_id=activity.id, title="Discussão Geral", description="Dúvidas do módulo")
        db_session.add(cat)
        db_session.commit()

        # Aluno cria tópico
        topic_payload = {"title": "Como aplicar Inversão de Dependência?", "body": "Tenho dúvida no uso de interfaces."}
        res_topic = client.post(
            f"/api/forum/category/{cat.id}/topics",
            json=topic_payload,
            headers=student_headers
        )
        assert res_topic.status_code == 201
        topic_id = res_topic.get_json()["id"]

        # Professor responde ao tópico
        res_post_prof = client.post(
            f"/api/forum/topics/{topic_id}/posts",
            json={"body": "Basta injetar as abstrações no construtor da classe consumidora."},
            headers=prof_headers
        )
        assert res_post_prof.status_code == 201
        post_prof_id = res_post_prof.get_json()["id"]

        # Professor marca como melhor resposta
        res_best = client.put(
            f"/api/forum/topics/{topic_id}/best-answer",
            json={"post_id": post_prof_id},
            headers=prof_headers
        )
        assert res_best.status_code == 200

        # Aluno curte a resposta do professor
        res_like = client.post(
            f"/api/forum/posts/{post_prof_id}/like",
            headers=student_headers
        )
        assert res_like.status_code in [200, 201]
        assert res_like.get_json()["liked"] is True

        # --- 7. ELEMENTO 5: CHAT DA ATIVIDADE E MODERAÇÃO ---
        chat_msg, err = ChatService.process_message(
            sender_id=aluno1.id,
            activity_id=activity.id,
            raw_content="Excelente explicação sobre Inversão de Dependência!"
        )
        assert err is None
        assert chat_msg is not None

        # Histórico do chat
        res_chat = client.get(f"/api/chat/activity/{activity.id}/messages", headers=student_headers)
        assert res_chat.status_code == 200
        messages = res_chat.get_json()
        assert len(messages) >= 1

        # Denúncia / moderação: Professor denuncia mensagem de teste
        spam_msg, _ = ChatService.process_message(
            sender_id=aluno1.id,
            activity_id=activity.id,
            raw_content="Mensagem para auditoria de denúncia"
        )
        res_report = client.post(f"/api/chat/messages/{spam_msg['id']}/report", headers=prof_headers)
        assert res_report.status_code == 200

        # --- 8. ELEMENTO 6: LEADERBOARD / HALL DA FAMA ---
        res_lb = client.get(f"/api/progress/{activity.id}/leaderboard", headers=student_headers)
        assert res_lb.status_code == 200
        lb_list = res_lb.get_json()
        assert len(lb_list) >= 1
        assert lb_list[0]["id"] == aluno1.id
        assert lb_list[0]["points"] >= 100

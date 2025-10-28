# backend/app/commands/simulations.py

import click
from flask.cli import with_appcontext
from app.models import db, User, Activity, ActivityProgress, StudentResponse, QuizContent
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timedelta
# --- Funções de Simulação ---
# Cada função aqui modifica o banco de dados para criar um cenário específico.
def _ensure_progress_exists(user, activity):
    """Função auxiliar para garantir que um registro de progresso exista."""
    progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity.id).first()
    if not progress:
        print("Criando registro de progresso para o usuário...")
        progress = ActivityProgress(
            student_id=user.id,
            activity_id=activity.id,
            class_id=activity.class_id,
            completed_steps=[]
        )
        db.session.add(progress)
    return progress

def _simulate_inspetor(user, activity):
    """Simula 100% de acerto em todas as questões para a medalha Inspetor."""
    print(f"Simulando 'Inspetor' para o usuário {user.email} na atividade {activity.id}...")
    
    # 1. Apaga qualquer resposta incorreta que o usuário possa ter na atividade
    StudentResponse.query.filter_by(student_id=user.id, activity_id=activity.id, is_correct=False).delete()
    print("Respostas incorretas anteriores foram removidas (se existiam).")

    # 2. Encontra todos os quizzes da atividade
    quiz_steps = [step for step in activity.gamification_design.get('progression_path', []) if step['type'] == 'quiz']
    if not quiz_steps:
        print("AVISO: Nenhuma etapa de quiz encontrada nesta atividade para simular.")
        return True # Retorna True para não dar erro, mas a condição pode não ser ideal

    # 3. Para cada quiz, forja uma resposta correta (se já não houver)
    questions_answered = 0
    for step in quiz_steps:
        quiz_content = QuizContent.query.filter_by(activity_id=activity.id, step_id=step['id']).first()
        if not quiz_content or not quiz_content.questions:
            continue
        
        for question in quiz_content.questions:
            # Verifica se já existe uma resposta para esta pergunta
            existing_response = StudentResponse.query.filter(
                StudentResponse.student_id == user.id,
                StudentResponse.activity_id == activity.id,
                StudentResponse.response_data['question'].astext == question['text']
            ).first()

            if not existing_response:
                new_response = StudentResponse(
                    student_id=user.id,
                    activity_id=activity.id,
                    is_correct=True,
                    response_data={'question': question['text'], 'answer': question['correct_option']}
                )
                db.session.add(new_response)
                questions_answered += 1

    print(f"SUCESSO: {questions_answered} respostas corretas foram forjadas. O usuário não possui respostas incorretas.")
    return True

def _simulate_velocista(user, activity):
    """Simula o usuário sendo um dos 3 primeiros a completar a atividade."""
    print(f"Simulando 'Velocista' para o usuário {user.email} na atividade {activity.id}...")
    progress = _ensure_progress_exists(user, activity)

    # 1. Garante que o usuário atual completou a atividade AGORA
    progress.completed_at = datetime.utcnow()
    print(f"Progresso do usuário '{user.name}' marcado como concluído em: {progress.completed_at}")

    # 2. Verifica quantos outros já completaram
    other_completions = ActivityProgress.query.filter(
        ActivityProgress.activity_id == activity.id,
        ActivityProgress.completed_at.isnot(None),
        ActivityProgress.student_id != user.id
    ).count()

    # 3. Se já houver 2 ou mais, a simulação não pode garantir o top 3, mas avisa.
    if other_completions >= 2:
        print(f"AVISO: {other_completions} outros usuários já completaram. A medalha pode não ser concedida.")
    else:
        print(f"Cenário ideal: Apenas {other_completions} outros usuários completaram. O usuário atual está no top 3.")

    print("SUCESSO: Cenário de conclusão simulado.")
    return True

def _simulate_fenix(user, activity):
    """Simula o cenário para a Medalha Fênix: ter errado e depois acertado a mesma questão."""
    print(f"Simulando 'Fênix' para o usuário {user.email} na atividade {activity.id}...")
    
    # 1. Encontra a primeira questão do primeiro quiz da atividade
    first_quiz_step = next((step for step in activity.gamification_design.get('progression_path', []) if step['type'] == 'quiz'), None)
    if not first_quiz_step:
        print("ERRO: Nenhuma etapa de quiz encontrada para simular a Fênix.")
        return False
        
    quiz_content = QuizContent.query.filter_by(activity_id=activity.id, step_id=first_quiz_step['id']).first()
    if not quiz_content or not quiz_content.questions:
        print(f"ERRO: A etapa de quiz '{first_quiz_step['id']}' não tem perguntas.")
        return False

    target_question = quiz_content.questions[0]
    
    # 2. Garante que exista uma resposta INCORRETA para essa pergunta
    incorrect_option = next((opt for opt in target_question['options'] if opt != target_question['correct_option']), "resposta_errada_simulada")
    
    existing_incorrect = StudentResponse.query.filter(
        StudentResponse.student_id == user.id,
        StudentResponse.activity_id == activity.id,
        StudentResponse.response_data['question'].astext == target_question['text'],
        StudentResponse.is_correct == False
    ).first()

    if not existing_incorrect:
        incorrect_response = StudentResponse(
            student_id=user.id,
            activity_id=activity.id,
            is_correct=False,
            response_data={'question': target_question['text'], 'answer': incorrect_option},
            created_at=datetime.utcnow() - timedelta(minutes=5) # Simula que foi respondido antes
        )
        db.session.add(incorrect_response)
        print(f"SUCESSO: Resposta incorreta para a pergunta '{target_question['text']}' foi forjada.")
    else:
        print(f"AVISO: O usuário já possuía uma resposta incorreta para a pergunta alvo.")
        
    return True

def _simulate_explorador(user, activity):
    """Simula a conclusão de todos os passos para a medalha Explorador."""
    print(f"Simulando 'Explorador' para o usuário {user.email} na atividade {activity.id}...")

    if not all([activity, activity.gamification_design, activity.gamification_design.get('progression_path')]):
        print("ERRO: Atividade não encontrada ou não possui uma trilha de progressão definida.")
        return False

    progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity.id).first()
    if not progress:
        print("Criando registro de progresso para o usuário...")
        progress = ActivityProgress(student_id=user.id, activity_id=activity.id, class_id=activity.class_id, completed_steps=[])
        db.session.add(progress)

    # Pega todos os IDs dos passos da atividade
    all_step_ids = [step['id'] for step in activity.gamification_design['progression_path']]
    
    # Forja o progresso, garantindo que todos os passos estão na lista de completados
    # Usamos um set para evitar duplicatas e depois convertemos para lista
    completed_steps_set = set(progress.completed_steps or [])
    completed_steps_set.update(all_step_ids)
    
    progress.completed_steps = list(completed_steps_set)
    
    print(f"SUCESSO: O progresso do usuário foi atualizado para conter {len(progress.completed_steps)} passos completos.")
    return True

# --- Dicionário de Simuladores ---
# Mapeia o nome da medalha para a função que simula sua condição.
SIMULATION_FUNCTIONS = {
    "Medalha do Explorador": _simulate_explorador,
    "Medalha do Inspetor": _simulate_inspetor,
    "Medalha do Velocista": _simulate_velocista,
    "Medalha \"Fênix\"": _simulate_fenix,
}


@click.command('simulate-condition')
@click.argument('user_email')
@click.argument('medal_name')
@click.option('--activity_id', required=True, type=int, help='O ID da atividade para a simulação.')
@with_appcontext
def simulate_condition_command(user_email, medal_name, activity_id):
    """
    Simula as condições de banco de dados para um usuário ganhar uma medalha.
    """
    print(f"--- Iniciando simulação para '{medal_name}' (Usuário: {user_email}, Atividade: {activity_id}) ---")

    user = User.query.filter_by(email=user_email).first()
    activity = Activity.query.get(activity_id)

    if not user:
        print(f"ERRO: Usuário '{user_email}' não encontrado.")
        return
    if not activity:
        print(f"ERRO: Atividade com ID '{activity_id}' não encontrada.")
        return

    simulation_function = SIMULATION_FUNCTIONS.get(medal_name)
    if not simulation_function:
        print(f"ERRO: Nenhuma simulação definida para a medalha '{medal_name}'.")
        return

    # Executa a simulação
    success = simulation_function(user, activity)
    
    if success:
        db.session.commit()
        print("Alterações salvas no banco de dados.")
    else:
        db.session.rollback()
        print("Nenhuma alteração foi salva devido a um erro na simulação.")
        
    print("--- Simulação finalizada. ---")


def init_app(app):
    """Registra os comandos no app Flask."""
    app.cli.add_command(simulate_condition_command)
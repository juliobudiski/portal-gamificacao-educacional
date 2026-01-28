# backend/app/routes/analytics.py

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc
from ..models import db, User, Class, Activity, ActivityProgress, Enrollment, StudentResponse, EventLog, QuizContent, SystemFeedback

# O prefixo registrado no __init__.py é '/api/analytics'
analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/professor/filters', methods=['GET'])
@jwt_required()
def get_professor_filters():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'professor':
        return jsonify({"message": "Acesso negado. Apenas professores."}), 403

    classes = Class.query.filter_by(professor_id=user.id).all()
    activities = Activity.query.filter_by(professor_id=user.id).all()

    return jsonify({
        'classes': [{'id': c.id, 'name': c.name} for c in classes],
        'activities': [{'id': a.id, 'title': a.title} for a in activities]
    }), 200


@analytics_bp.route('/professor/performance', methods=['GET'])
@jwt_required()
def get_student_performance():
    try:
        current_user_id = get_jwt_identity()
        class_id = request.args.get('class_id')
        activity_id = request.args.get('activity_id')
        search_term = request.args.get('search')

        if not class_id:
            return jsonify({'error': 'Class ID is required'}), 400

        if activity_id:
            try:
                activity_id = int(activity_id)
            except ValueError:
                return jsonify({'error': 'Activity ID must be a number'}), 400

        target_class = Class.query.get(class_id)
        if not target_class: 
             return jsonify({"message": "Turma não encontrada."}), 404

        # Busca alunos
        query = db.session.query(User).join(Enrollment).filter(Enrollment.class_id == class_id)
        if search_term:
            query = query.filter(User.name.ilike(f'%{search_term}%'))
        students = query.all()
        
        # Estatísticas Gerais
        stats = {
            'total_students': len(students),
            'completed_count': 0,
            'average_score': 0,
            'average_accuracy': 0,
            'total_narratives_read': 0,
            'total_possible_points': 0
        }
        
        # --- CÁLCULO ROBUSTO DO MÁXIMO DE PONTOS ---
        if activity_id:
            # 1. Tenta somar de QuizContent (Arquitetura Nova: Conteúdo por Passo)
            quiz_contents = QuizContent.query.filter_by(activity_id=activity_id).all()
            
            if quiz_contents:
                current_app.logger.info(f"[ANALYTICS] Atividade {activity_id}: Encontrados {len(quiz_contents)} passos de quiz na tabela QuizContent.")
                for qc in quiz_contents:
                    if qc.questions and isinstance(qc.questions, list):
                        for q in qc.questions:
                            try:
                                points = int(q.get('points', 10))
                                stats['total_possible_points'] += points
                            except:
                                stats['total_possible_points'] += 10
            
            # 2. Se não achou nada em QuizContent, tenta o método antigo (game_elements)
            # IMPORTANTE: Só entra aqui se o total ainda for 0
            if stats['total_possible_points'] == 0:
                activity = Activity.query.get(activity_id)
                if activity and activity.game_elements and isinstance(activity.game_elements, dict):
                    questions = activity.game_elements.get('questions', [])
                    if questions:
                        current_app.logger.info(f"[ANALYTICS] Atividade {activity_id}: Usando game_elements antigo ({len(questions)} perguntas).")
                        for q in questions:
                            try:
                                points = int(q.get('points', 10))
                                stats['total_possible_points'] += points
                            except:
                                stats['total_possible_points'] += 10

            # 3. Fallback visual final (se a atividade não tiver perguntas nenhuma)
            if stats['total_possible_points'] == 0:
                current_app.logger.warning(f"[ANALYTICS] Atividade {activity_id}: Nenhuma pergunta encontrada. Usando fallback 100.")
                stats['total_possible_points'] = 100 
            
            current_app.logger.info(f"[ANALYTICS] Atividade {activity_id}: Total de Pontos Possíveis = {stats['total_possible_points']}")
        # ------------------------------------------------
        
        results = []
        
        # Acumuladores
        total_activity_points = 0
        total_global_xp = 0
        students_with_progress = 0
        sum_accuracy = 0

        for student in students:
            total_global_xp += (student.global_xp or 0)
            student_data = {
                'id': student.id,
                'name': student.name,
                'email': student.email,
                'avatar': student.profile_picture,
                'global_xp': student.global_xp or 0
            }

            if activity_id:
                progress = ActivityProgress.query.filter_by(student_id=student.id, activity_id=activity_id).first()
                
                # Métricas detalhadas
                correct_answers = StudentResponse.query.filter_by(student_id=student.id, activity_id=activity_id, is_correct=True).count()
                total_responses = StudentResponse.query.filter_by(student_id=student.id, activity_id=activity_id).count()
                wrong_answers = total_responses - correct_answers
                
                accuracy = (correct_answers / total_responses * 100) if total_responses > 0 else 0
                
                narratives_read = EventLog.query.filter_by(
                    user_id=student.id, 
                    activity_id=activity_id, 
                    action='narrative_viewed'
                ).count()

                stats['total_narratives_read'] += narratives_read

                if progress:
                    student_data.update({
                        'status': progress.status,
                        'points_earned': progress.points_earned,
                        'coins': progress.coins,
                        'attempts': progress.attempts,
                        'completed_at': progress.completed_at.isoformat() if progress.completed_at else None,
                        'accuracy': round(accuracy, 1),
                        'narratives_read': narratives_read,
                        'correct_count': correct_answers,
                        'wrong_count': wrong_answers,
                        'total_responses': total_responses
                    })
                    
                    if progress.status == 'completed':
                        stats['completed_count'] += 1
                    
                    if progress.points_earned is not None: 
                        total_activity_points += progress.points_earned
                        sum_accuracy += accuracy
                        students_with_progress += 1
                else:
                    student_data.update({
                        'status': 'not_started', 
                        'points_earned': 0, 
                        'coins': 0, 
                        'attempts': 0, 
                        'completed_at': None,
                        'accuracy': 0,
                        'narratives_read': 0,
                        'correct_count': 0,
                        'wrong_count': 0,
                        'total_responses': 0
                    })

            else:
                student_data['status'] = 'active'
                student_data['last_location'] = f"{student.cached_city or ''} - {student.cached_state or ''}"
                if student_data['last_location'] == " - ": student_data['last_location'] = "Desconhecido"

            results.append(student_data)

        # Médias Finais
        if activity_id:
            if students_with_progress > 0:
                stats['average_score'] = round(total_activity_points / students_with_progress, 1)
                stats['average_accuracy'] = round(sum_accuracy / students_with_progress, 1)
        else:
            if stats['total_students'] > 0:
                stats['average_score'] = int(total_global_xp / stats['total_students'])

        results.sort(key=lambda x: x['name'])

        return jsonify({'stats': stats, 'students': results})
        
    except Exception as e:
        current_app.logger.error(f"Erro em performance: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500
    
@analytics_bp.route('/feedback/check-eligibility', methods=['GET'])
@jwt_required()
def check_feedback_eligibility():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    # 1. Se já respondeu, aborta
    if SystemFeedback.query.filter_by(user_id=user.id).first():
        return jsonify({"show_modal": False}), 200

    show_modal = False
    
    # 2. Critérios por Role
    if user.role == 'professor':
        # Verifica se criou pelo menos 1 atividade
        activity_count = Activity.query.filter_by(professor_id=user.id).count()
        if activity_count >= 1:
            show_modal = True
            
    elif user.role == 'aluno':
        
        log_count = EventLog.query.filter_by(user_id=user.id).count()
        
        # Opcional: Você pode checar também se ele tem XP acumulado, se seu modelo User tiver esse campo
        # has_xp = user.total_xp_earned > 0 
        
        if log_count >= 5: 
            show_modal = True

    return jsonify({"show_modal": show_modal, "role": user.role}), 200

@analytics_bp.route('/feedback/submit', methods=['POST'])
@jwt_required()
def submit_feedback():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Prevenção de duplicidade
    if SystemFeedback.query.filter_by(user_id=user_id).first():
        return jsonify({"message": "Feedback já enviado."}), 400

    feedback = SystemFeedback(
        user_id=user_id,
        role=data.get('role'),
        data=data.get('responses') # O JSON com as respostas do form
    )
    
    db.session.add(feedback)
    db.session.commit()
    
    return jsonify({"message": "Obrigado pelo feedback!"}), 201
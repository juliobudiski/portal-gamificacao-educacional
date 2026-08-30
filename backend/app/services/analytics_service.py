"""
Serviço de Análises e Estatísticas (AnalyticsService)
Responsável por compilar dados de engajamento, precisão e progresso dos alunos
para preencher os dashboards dos professores. Também gerencia a elegibilidade
e o envio de feedbacks do sistema.
"""

from flask import current_app
from ..models import db, User, Class, Activity, ActivityProgress, Enrollment, StudentResponse, EventLog, QuizContent, SystemFeedback

class AnalyticsService:
    @staticmethod
    def get_professor_filters(user_id):
        """
        Retorna as listas de turmas e atividades pertencentes a um professor
        para preencher os filtros (dropdowns) na interface de dashboard.
        """
        user = User.query.get(user_id)
        if not user or user.role != 'professor':
            return None, {"message": "Acesso negado. Apenas professores."}, 403

        classes = Class.query.filter_by(professor_id=user.id).all()
        activities = Activity.query.filter_by(professor_id=user.id).all()

        return {
            'classes': [{'id': c.id, 'name': c.name} for c in classes],
            'activities': [{'id': a.id, 'title': a.title} for a in activities]
        }, None, 200

    @staticmethod
    def _calculate_max_possible_points(activity_id):
        """
        Calcula o total de pontos que um aluno pode ganhar ao gabaritar a atividade.
        Itera sobre todas as questões de todos os quizzes atrelados à atividade.
        Possui lógica de fallback para modelos de dados legados.
        """
        total_possible_points = 0
        quiz_contents = QuizContent.query.filter_by(activity_id=activity_id).all()
        
        if quiz_contents:
            current_app.logger.info(f"[ANALYTICS] Atividade {activity_id}: Encontrados {len(quiz_contents)} passos de quiz.")
            for qc in quiz_contents:
                if qc.questions and isinstance(qc.questions, list):
                    for q in qc.questions:
                        try:
                            points = int(q.get('points', 10))
                            total_possible_points += points
                        except:
                            total_possible_points += 10
        
        # Fallback para atividades antigas onde as questões ficavam em 'game_elements'
        if total_possible_points == 0:
            activity = Activity.query.get(activity_id)
            if activity and activity.game_elements and isinstance(activity.game_elements, dict):
                questions = activity.game_elements.get('questions', [])
                if questions:
                    current_app.logger.info(f"[ANALYTICS] Atividade {activity_id}: Usando game_elements antigo.")
                    for q in questions:
                        try:
                            points = int(q.get('points', 10))
                            total_possible_points += points
                        except:
                            total_possible_points += 10

        # Fallback de segurança para evitar divisão por zero no frontend
        if total_possible_points == 0:
            current_app.logger.warning(f"[ANALYTICS] Atividade {activity_id}: Nenhuma pergunta. Usando fallback 100.")
            total_possible_points = 100 
        
        current_app.logger.info(f"[ANALYTICS] Atividade {activity_id}: Pontos Possíveis = {total_possible_points}")
        return total_possible_points

    @staticmethod
    def get_student_performance(class_id, activity_id, search_term):
        """
        Agrega e compila o desempenho de todos os alunos de uma turma específica,
        filtrando por uma atividade se fornecida.
        Retorna pontuação, precisão de respostas, número de tentativas e XP global.
        """
        try:
            if not class_id:
                return None, {'error': 'Class ID is required'}, 400

            if activity_id:
                try:
                    activity_id = int(activity_id)
                except ValueError:
                    return None, {'error': 'Activity ID must be a number'}, 400

            target_class = Class.query.get(class_id)
            if not target_class: 
                 return None, {"message": "Turma não encontrada."}, 404

            # Busca alunos matriculados na turma e aplica pesquisa por nome se houver
            query = db.session.query(User).join(Enrollment).filter(Enrollment.class_id == class_id)
            if search_term:
                query = query.filter(User.name.ilike(f'%{search_term}%'))
            students = query.all()
            
            stats = {
                'total_students': len(students),
                'completed_count': 0,
                'average_score': 0,
                'average_accuracy': 0,
                'total_narratives_read': 0,
                'total_possible_points': 0
            }
            
            if activity_id:
                stats['total_possible_points'] = AnalyticsService._calculate_max_possible_points(activity_id)
            
            results = []
            
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
                    # Busca os dados de progresso e as respostas para calcular a acurácia
                    progress = ActivityProgress.query.filter_by(student_id=student.id, activity_id=activity_id).first()
                    
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
                        # Preenche defaults caso o aluno não tenha iniciado
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
                    # Visão geral da turma (sem atividade específica)
                    student_data['status'] = 'active'
                    student_data['last_location'] = f"{student.cached_city or ''} - {student.cached_state or ''}"
                    if student_data['last_location'] == " - ": student_data['last_location'] = "Desconhecido"

                results.append(student_data)

            # Calcula médias para os cartões de estatística globais
            if activity_id:
                if students_with_progress > 0:
                    stats['average_score'] = round(total_activity_points / students_with_progress, 1)
                    stats['average_accuracy'] = round(sum_accuracy / students_with_progress, 1)
            else:
                if stats['total_students'] > 0:
                    stats['average_score'] = int(total_global_xp / stats['total_students'])

            results.sort(key=lambda x: x['name'])

            return {'stats': stats, 'students': results}, None, 200
            
        except Exception as e:
            current_app.logger.error(f"Erro em performance: {str(e)}", exc_info=True)
            return None, {"error": str(e)}, 500

    @staticmethod
    def check_feedback_eligibility(user_id):
        """
        Verifica se o usuário já atendeu aos requisitos mínimos para ser convidado
        a preencher o formulário de feedback (NPS) do sistema (ex: Professor já criou
        pelo menos 1 atividade ou Aluno gerou 5 eventos no log).
        """
        user = User.query.get(user_id)

        if SystemFeedback.query.filter_by(user_id=user.id).first():
            return {"show_modal": False}, None, 200

        show_modal = False
        
        if user.role == 'professor':
            activity_count = Activity.query.filter_by(professor_id=user.id).count()
            if activity_count >= 1:
                show_modal = True
                
        elif user.role == 'aluno':
            log_count = EventLog.query.filter_by(user_id=user.id).count()
            if log_count >= 5: 
                show_modal = True

        return {"show_modal": show_modal, "role": user.role}, None, 200

    @staticmethod
    def submit_feedback(user_id, data):
        """Salva a avaliação de satisfação (NPS e comentários) fornecida pelo usuário."""
        if SystemFeedback.query.filter_by(user_id=user_id).first():
            return None, {"message": "Feedback já enviado."}, 400

        feedback = SystemFeedback(
            user_id=user_id,
            role=data.get('role'),
            data=data.get('responses')
        )
        
        try:
            db.session.add(feedback)
            db.session.commit()
            return {"message": "Feedback recebido com sucesso!"}, None, 201
        except Exception as e:
            db.session.rollback()
            return None, {"error": str(e)}, 500

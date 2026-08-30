from flask import current_app
from ..models import db, Medal, UserUnlockedMedal, User, ActivityProgress, StudentResponse, Activity

class MedalService:
    @staticmethod
    def check_and_award_medals(user_id, activity_id, event_type, **kwargs):
        """Função central que é chamada em pontos chave da aplicação."""
        user = User.query.get(user_id)
        if not user: return

        event_triggers = {
            'activity_completed': [
                {'name': 'Medalha do Explorador', 'func': MedalService._check_medal_explorador},
                {'name': 'Medalha do Inspetor', 'func': MedalService._check_medal_inspetor},
                {'name': 'Medalha do Velocista', 'func': MedalService._check_medal_velocista},
            ],
            'quiz_answer_submitted': [
                {'name': 'Medalha "Fênix"', 'func': MedalService._check_medal_fenix},
            ],
            'step_completed': []
        }

        triggered_checks = event_triggers.get(event_type, [])
        if not triggered_checks: return

        unlocked_medal_ids = {m.medal_id for m in UserUnlockedMedal.query.filter_by(user_id=user_id).all()}
        medals_to_award = []

        for trigger in triggered_checks:
            medal_name = trigger['name']
            check_function = trigger['func']
            medal = Medal.query.filter_by(name=medal_name).first()

            if not medal or medal.id in unlocked_medal_ids:
                continue

            if check_function(user, activity_id, **kwargs):
                new_unlock = UserUnlockedMedal(user_id=user.id, medal_id=medal.id, activity_id=activity_id)
                db.session.add(new_unlock)
                medals_to_award.append(medal.name)
                current_app.logger.info(f"Medalha '{medal.name}' concedida ao usuário {user_id} na atividade {activity_id}.")

        if medals_to_award:
            db.session.commit()

    @staticmethod
    def _check_medal_explorador(user, activity_id, **kwargs):
        progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()
        activity = Activity.query.get(activity_id)

        if not all([progress, activity, activity.gamification_design, activity.gamification_design.get('progression_path')]):
            return False

        all_step_ids = {step['id'] for step in activity.gamification_design['progression_path']}
        completed_steps_set = set(progress.completed_steps or [])

        return all_step_ids.issubset(completed_steps_set)

    @staticmethod
    def _check_medal_inspetor(user, activity_id, **kwargs):
        incorrect_response = StudentResponse.query.filter_by(
            student_id=user.id, activity_id=activity_id, is_correct=False
        ).first()
        return incorrect_response is None

    @staticmethod
    def _check_medal_velocista(user, activity_id, **kwargs):
        completion_count = ActivityProgress.query.filter(
            ActivityProgress.activity_id == activity_id,
            ActivityProgress.completed_at.isnot(None),
            ActivityProgress.student_id != user.id
        ).count()
        return completion_count < 3

    @staticmethod
    def _check_medal_fenix(user, activity_id, **kwargs):
        is_current_answer_correct = kwargs.get('is_correct', False)
        if not is_current_answer_correct:
            return False

        question_text = kwargs.get('question_text')
        if not question_text:
            return False

        previous_incorrect_response = StudentResponse.query.filter(
            StudentResponse.student_id == user.id,
            StudentResponse.activity_id == activity_id,
            StudentResponse.response_data['question'].astext == question_text,
            StudentResponse.is_correct == False
        ).first()

        return previous_incorrect_response is not None

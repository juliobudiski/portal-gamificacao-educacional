from datetime import datetime
from flask import current_app
from ..models import db, User, ActivityProgress, Activity, Enrollment, Team

class ProgressService:
    @staticmethod
    def xp_for_next_level(level):
        """Calcula o XP necessário para o próximo nível com base no nível atual."""
        return 100 + (level - 1) * 50

    @staticmethod
    def calculate_level(total_points):
        """Calcula o nível atual, o XP para o próximo nível e o XP acumulado até o nível atual."""
        level = 1
        xp_required_for_current_level = 0
        xp_needed = ProgressService.xp_for_next_level(level)

        if total_points is None:
            total_points = 0

        while total_points >= xp_needed:
            total_points -= xp_needed
            xp_required_for_current_level += xp_needed
            level += 1
            xp_needed = ProgressService.xp_for_next_level(level)
        
        return {
            "level": level,
            "xpForNextLevel": xp_needed,
            "xpEarnedForCurrentLevel": total_points,
            "xpAccumulatedUntilCurrentLevel": xp_required_for_current_level
        }

    @staticmethod
    def get_multiplayer_positions(user_id, activity):
        """
        Retorna posições no tabuleiro.
        - Se for EM EQUIPE: Retorna 'teammates' (meu time) e 'rivals' (outros times).
        - Se for SOLO: Retorna todos os alunos da turma em 'teammates' (como 'Colegas').
        """
        data = { "teammates": {}, "rivals": {} }
        
        progression_path = activity.gamification_design.get('progression_path', []) if activity.gamification_design else []
        step_order = {step['id']: i for i, step in enumerate(progression_path)}
        step_order['start'] = -1
        ordered_step_ids = [step['id'] for step in progression_path]

        def get_current_step_id(progress_obj):
            if not progress_obj or not progress_obj.completed_steps:
                return 'start'
            last_completed = progress_obj.completed_steps[-1]
            if ordered_step_ids and last_completed == ordered_step_ids[-1]:
                 return 'final_reward' if progress_obj.status == 'completed' else last_completed
            current_index = step_order.get(last_completed, -1) + 1
            if current_index < len(ordered_step_ids):
                return ordered_step_ids[current_index]
            return last_completed

        if not activity.is_team_activity:
            results = (
                db.session.query(User, ActivityProgress)
                .join(Enrollment, User.id == Enrollment.student_id)
                .outerjoin(ActivityProgress, (ActivityProgress.student_id == User.id) & (ActivityProgress.activity_id == activity.id))
                .filter(Enrollment.class_id == activity.class_id)
                .filter(User.id != user_id)
                .all()
            )
            
            for user_obj, prog in results:
                current_step = get_current_step_id(prog)
                
                if current_step not in data["teammates"]:
                    data["teammates"][current_step] = []
                
                avatar = prog.equipped_activity_avatar_url if prog else None
                avatar = avatar or user_obj.profile_picture or '/avatars/default_avatar.webp'
                
                data["teammates"][current_step].append({
                    "name": user_obj.name,
                    "avatar": avatar
                })
                
            return data

        my_enrollment = Enrollment.query.filter_by(student_id=user_id, class_id=activity.class_id).first()
        if not my_enrollment or not my_enrollment.team_id:
            return data 

        my_team_id = my_enrollment.team_id
        
        results = (
            db.session.query(Enrollment, User, ActivityProgress, Team)
            .join(User, Enrollment.student_id == User.id)
            .join(Team, Enrollment.team_id == Team.id)
            .outerjoin(ActivityProgress, (ActivityProgress.student_id == User.id) & (ActivityProgress.activity_id == activity.id))
            .filter(Enrollment.class_id == activity.class_id)
            .all()
        )

        rival_max_indices = {}
        rival_teams_info = {}

        for enroll, user_obj, prog, team in results:
            current_step = get_current_step_id(prog)
            current_index = step_order.get(current_step, -1)
            if current_step == 'final_reward': current_index = 9999
            
            if team.id == my_team_id:
                if user_obj.id == user_id: continue 

                if current_step not in data["teammates"]:
                    data["teammates"][current_step] = []
                
                avatar = prog.equipped_activity_avatar_url if prog else None
                avatar = avatar or user_obj.profile_picture or '/avatars/default_avatar.webp'
                
                data["teammates"][current_step].append({
                    "name": user_obj.name,
                    "avatar": avatar
                })

            else:
                if team.id not in rival_max_indices:
                    rival_max_indices[team.id] = -99
                    rival_teams_info[team.id] = team
                
                if current_index > rival_max_indices[team.id]:
                    rival_max_indices[team.id] = current_index

        for r_team_id, max_idx in rival_max_indices.items():
            if max_idx == -99: step_id = 'start'
            elif max_idx == 9999: step_id = 'final_reward'
            elif 0 <= max_idx < len(ordered_step_ids): step_id = ordered_step_ids[max_idx]
            else: step_id = 'start'

            if step_id not in data["rivals"]:
                data["rivals"][step_id] = []
            
            team_obj = rival_teams_info[r_team_id]
            data["rivals"][step_id].append({
                "name": team_obj.name,
                "avatar": team_obj.avatar_url or '/badges/default_shield.webp'
            })

        return data

    @staticmethod
    def get_progress_json(user_id, activity_id):
        user = User.query.get(user_id)
        if not user or user.role != 'aluno':
            raise Exception("Acesso negado: Apenas alunos podem ver o progresso.")

        progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()
        activity = Activity.query.get(activity_id)
        if not activity:
            raise Exception("Atividade não encontrada.")

        now = datetime.utcnow()
        if activity.available_from and now < activity.available_from:
            raise Exception(f"Esta atividade estará disponível em {activity.available_from.strftime('%d/%m/%Y às %H:%M')}.")
        
        if activity.expires_at and now > activity.expires_at:
            raise Exception("O prazo para esta atividade já encerrou.")
        
        if not progress:
            current_app.logger.info(f"Nenhum progresso encontrado para o usuário {user.id}. Criando novo registro para a turma {activity.class_id}.")
            progress = ActivityProgress(
                student_id=user.id,
                activity_id=activity.id,
                class_id=activity.class_id,
                status='in_progress'
            )
            db.session.add(progress)
            db.session.commit()

        total_xp = progress.total_xp_earned if progress.total_xp_earned is not None else 0
        level_info = ProgressService.calculate_level(total_xp)
        
        multiplayer_data = ProgressService.get_multiplayer_positions(user.id, activity)
        team_name = None 
        
        if activity.is_team_activity:            
            enrollment = Enrollment.query.filter_by(student_id=user.id, class_id=activity.class_id).first()
            if enrollment and enrollment.team_id:
                team = Team.query.get(enrollment.team_id)
                if team:
                    team_name = team.name

        total_possible_points = 0
        total_questions = 0
        if activity.game_elements and isinstance(activity.game_elements.get('questions'), list):
            questions = activity.game_elements['questions']
            total_questions = len(questions)
            total_possible_points = sum(int(q.get('points', 0)) for q in questions)

        stats = {
            "scoreAchieved": progress.points_earned or 0,
            "totalPossibleScore": total_possible_points,
            "totalQuestions": total_questions,
            "averageTime": 35,
            "achievements": 3
        }

        return {
            "level": level_info["level"],
            "xp": level_info["xpEarnedForCurrentLevel"],
            "xpForNextLevel": level_info["xpForNextLevel"],
            "points_earned": progress.points_earned or 0,
            "coins": progress.coins or 0,
            "status": progress.status,
            "completed_steps": progress.completed_steps or [],
            "attempts": progress.attempts or 0,
            "stats": stats,
            "unlocked_activity_avatars": progress.unlocked_activity_avatars or [],
            "equipped_activity_avatar_url": progress.equipped_activity_avatar_url,
            "teammates_positions": multiplayer_data["teammates"],
            "rivals_positions": multiplayer_data["rivals"],
            "team_name": team_name
        }

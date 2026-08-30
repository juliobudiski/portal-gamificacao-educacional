"""
Serviço do Aluno (StudentService)
Responsável por formatar e agregar os dados que abastecem o painel
principal (Dashboard) da visão do Aluno. Isso inclui nível global,
atividades pendentes, turmas matriculadas e histórico de conclusão.
"""
from ..models import db, Class, Enrollment, Activity, ActivityProgress, UserUnlockedMedal

class StudentService:
    @staticmethod
    def calculate_global_level(total_xp):
        """
        Calcula o nível global do aluno (Curva Exponencial/Geométrica).
        Ao contrário do nível da atividade, o nível global exige progressivamente 
        mais esforço (multiplicador 1.5x) para subir de rank.
        """
        if total_xp is None:
            total_xp = 0
            
        level = 1
        xp_needed = 250
        xp_cumulative = 0

        while total_xp >= xp_needed:
            total_xp -= xp_needed
            xp_cumulative += xp_needed
            level += 1
            xp_needed = int(xp_needed * 1.5)
        
        return {
            "level": level,
            "xp_to_next_level": xp_needed,
            "xp_current": total_xp,
            "xp_cumulative": xp_cumulative
        }

    @staticmethod
    def get_dashboard_data(user):
        """
        Monta o payload inicial da Home do aluno. 
        Cruza tabelas de Matrícula (Enrollment) com Atividades e Progresso
        para retornar apenas o que é relevante e pendente (To-Do list).
        """
        enrolled_classes = Class.query.join(Enrollment).filter(Enrollment.student_id == user.id).all()
        
        classes_data = []
        for cls in enrolled_classes:
            classes_data.append({
                "id": cls.id,
                "name": cls.name,
                "description": cls.description,
                "professor_name": cls.professor.name,
                "activities_count": len(cls.assigned_activities)
            })

        pending_activities_query = db.session.query(
            Activity, 
            ActivityProgress.status
        ).select_from(Activity).join(
            Enrollment, Activity.class_id == Enrollment.class_id
        ).outerjoin(
            ActivityProgress, 
            db.and_(
                ActivityProgress.activity_id == Activity.id,
                ActivityProgress.student_id == user.id
            )
        ).filter(
            Enrollment.student_id == user.id
        ).all()

        pending_activities_data = []
        for activity, progress_status in pending_activities_query:
            pending_activities_data.append({
                "id": activity.id,
                "title": activity.title,
                "class_name": activity.class_obj.name if activity.class_obj else "N/A",
                "expiresAt": activity.expires_at.isoformat() if activity.expires_at else None,
                "is_completed": progress_status == 'completed'
            })

        global_level_info = StudentService.calculate_global_level(user.global_xp)
        total_achievements = UserUnlockedMedal.query.filter_by(user_id=user.id).count()
        
        performance_data = {
            "global_level_info": global_level_info,
            "total_achievements": total_achievements
        }

        return {
            "classes": classes_data,
            "pendingActivities": pending_activities_data,
            "performance": performance_data
        }

    @staticmethod
    def get_all_activities(user):
        """
        Gera o histórico completo (Histórico Escolar Gamificado) de todas as 
        atividades (pendentes e concluídas), calculando a porcentagem de 
        conclusão baseada no Gamification Design (passos do tabuleiro).
        """
        activities_query = db.session.query(
            Activity,
            ActivityProgress
        ).join(
            Enrollment, Activity.class_id == Enrollment.class_id
        ).outerjoin(
            ActivityProgress,
            db.and_(
                ActivityProgress.activity_id == Activity.id,
                ActivityProgress.student_id == user.id
            )
        ).filter(
            Enrollment.student_id == user.id
        ).all()

        activities_list = []

        for activity, progress in activities_query:
            total_steps = 0
            completed_steps_count = 0
            percentage = 0

            if activity.gamification_design and 'progression_path' in activity.gamification_design:
                total_steps = len(activity.gamification_design['progression_path'])

            if progress and progress.completed_steps:
                completed_steps_count = len(progress.completed_steps)

            if total_steps > 0:
                percentage = int((completed_steps_count / total_steps) * 100)
            
            if progress and progress.status == 'completed':
                percentage = 100

            xp_reward = 0
            if activity.gamification_rules and 'reward_xp' in activity.gamification_rules:
                 xp_reward = int(activity.gamification_rules['reward_xp'])
            elif activity.rewards_offered and 'completion_xp' in activity.rewards_offered:
                 xp_reward = int(activity.rewards_offered['completion_xp'])
            else:
                xp_reward = 100 

            activities_list.append({
                "id": activity.id,
                "title": activity.title,
                "description": activity.description,
                "class_name": activity.class_obj.name if activity.class_obj else "Turma Desconhecida",
                "expiresAt": activity.expires_at.isoformat() if activity.expires_at else None,
                "is_completed": progress.status == 'completed' if progress else False,
                "xp_earned": progress.total_xp_earned if progress else 0,
                "xp_reward": xp_reward,
                "grade": progress.points_earned if progress else None,
                "progress_percentage": percentage 
            })

        return activities_list

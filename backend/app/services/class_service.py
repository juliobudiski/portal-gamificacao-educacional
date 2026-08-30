from flask import current_app
from ..models import db, User, Class, Enrollment, Team
import random

class ClassService:
    @staticmethod
    def assign_student_to_smallest_team(existing_teams, new_enrollment, user_id):
        """Encontra o time com menos membros e matricula o aluno nele para balanceamento."""
        existing_teams.sort(key=lambda t: len(t.members))
        target_team = existing_teams[0]
        new_enrollment.team_id = target_team.id
        current_app.logger.info(f"Aluno {user_id} sorteado automaticamente para a Casa {target_team.name}")

    @staticmethod
    def distribute_students_to_teams(students, created_teams, method):
        """Distribui uma lista de alunos entre times recém-criados usando um método específico."""
        num_teams = len(created_teams)
        if method == 'balanced':
            students.sort(key=lambda x: x.student.global_xp if x.student else 0, reverse=True)
        else:
            random.shuffle(students)
            
        for index, enrollment in enumerate(students):
            target_team = created_teams[index % num_teams]
            enrollment.team_id = target_team.id

    @staticmethod
    def generate_teams(class_id, num_teams, custom_names, method):
        """Cria equipes e distribui alunos matriculados."""
        created_teams = []
        for i in range(num_teams):
            name = custom_names[i] if i < len(custom_names) else f"Equipe {i+1}"
            new_team = Team(name=name, class_id=class_id)
            db.session.add(new_team)
            created_teams.append(new_team)
        
        db.session.flush()

        enrollments = Enrollment.query.filter_by(class_id=class_id).all()
        
        if enrollments:
            students = [e for e in enrollments]
            ClassService.distribute_students_to_teams(students, created_teams, method)

        db.session.commit()
        return bool(enrollments)

    @staticmethod
    def join_class(user, enrollment_code):
        """Processa a entrada de um aluno em uma turma pelo código."""
        class_to_join = Class.query.filter_by(enrollment_code=enrollment_code).first()
        if not class_to_join:
            return None, {"message": "Código de inscrição inválido."}, 404

        existing_enrollment = Enrollment.query.filter_by(student_id=user.id, class_id=class_to_join.id).first()
        if existing_enrollment:
            return None, {"message": "Você já está matriculado nesta turma."}, 409

        new_enrollment = Enrollment(student_id=user.id, class_id=class_to_join.id)
        existing_teams = Team.query.filter_by(class_id=class_to_join.id).all()
        
        if existing_teams:
            ClassService.assign_student_to_smallest_team(existing_teams, new_enrollment, user.id)
            
        db.session.add(new_enrollment)
        db.session.commit()
        current_app.logger.info(f"Aluno ID {user.id} matriculado com sucesso na turma '{class_to_join.name}' (ID: {class_to_join.id}).")
        
        return class_to_join.to_dict(), None, 201

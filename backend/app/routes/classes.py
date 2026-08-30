from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from .. import db
from ..models import db, User, Class, Enrollment, Activity, Team
import uuid
import logging
from flask_cors import cross_origin
import random

import random

from ..services.class_service import ClassService

class_bp = Blueprint('classes', __name__)
logger = logging.getLogger(__name__)


@class_bp.route('', methods=['POST'])
@cross_origin()
@jwt_required()
def create_class():
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"Usuário ID {current_user_id} tentando criar uma nova turma.")
    
    user = User.query.get(current_user_id)

    if not user or user.role != 'professor':
        current_app.logger.warning(f"Acesso negado para ID {current_user_id} na criação de turma. Role: {user.role if user else 'N/A'}")
        return jsonify({"message": "Acesso negado. Apenas professores podem criar turmas."}), 403

    data = request.get_json()
    current_app.logger.debug(f"Dados recebidos para nova turma: {data}")

    name = data.get('name')
    description = data.get('description')

    if not name:
        current_app.logger.warning(f"Tentativa de criar turma pelo ID {current_user_id} falhou: nome ausente.")
        return jsonify({"message": "O nome da turma é obrigatório."}), 400

    # Generate a unique enrollment code
    enrollment_code = str(uuid.uuid4()).split('-')[0].upper() # Simple unique code

    try:
        new_class = Class(
            name=name,
            description=description,
            professor_id=user.id,
            enrollment_code=enrollment_code
        )
        db.session.add(new_class)
        db.session.commit()
        current_app.logger.info(f"Turma '{new_class.name}' (ID: {new_class.id}, Code: {new_class.enrollment_code}) criada com sucesso pelo usuário ID {current_user_id}.")

        return jsonify({"message": "Turma criada com sucesso!", "class": new_class.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao criar turma para o usuário ID {current_user_id}: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro interno do servidor ao criar turma: {str(e)}"}), 500

@class_bp.route('', methods=['GET'])
@cross_origin()
@jwt_required()
def get_classes():
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"Usuário ID {current_user_id} solicitou a lista de turmas.")
    
    user = User.query.get(current_user_id)

    if not user:
        current_app.logger.error(f"Tentativa de listar turmas para usuário inexistente: ID {current_user_id}")
        return jsonify({"message": "Usuário não encontrado."}), 404

    if user.role == 'professor':
        classes = Class.query.filter_by(professor_id=current_user_id).all()
        classes_data = [cls.to_dict() for cls in classes]
        current_app.logger.info(f"Retornando {len(classes_data)} turmas criadas pelo professor ID {current_user_id}.")
        return jsonify(classes_data), 200
    elif user.role == 'aluno':
        enrollments = Enrollment.query.filter_by(student_id=current_user_id).all()
        enrolled_classes_data = []
        for enrollment in enrollments:
            class_info = Class.query.get(enrollment.class_id)
            if class_info:
                class_dict = class_info.to_dict()
                professor_name = User.query.get(class_info.professor_id).name if User.query.get(class_info.professor_id) else 'Unknown'
                class_dict['professor_name'] = professor_name
                enrolled_classes_data.append(class_dict)
        current_app.logger.info(f"Retornando {len(enrolled_classes_data)} turmas em que o aluno ID {current_user_id} está matriculado.")
        return jsonify(enrolled_classes_data), 200
    else:
        current_app.logger.warning(f"Acesso negado à lista de turmas para o ID {current_user_id}. Role: {user.role}")
        return jsonify({"message": "Acesso negado. Sua função não permite visualizar turmas."}), 403

@class_bp.route('/<int:class_id>', methods=['GET'])
@cross_origin()
@jwt_required()
def get_class_details(class_id):
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"Usuário ID {current_user_id} solicitou detalhes da turma ID {class_id}.")

    user = User.query.get(current_user_id)
    class_obj = Class.query.get(class_id)

    if not user:
        current_app.logger.error(f"Tentativa de ver detalhes da turma ID {class_id} para usuário inexistente: ID {current_user_id}")
        return jsonify({"message": "Usuário não encontrado."}), 404
    
    if not class_obj:
        current_app.logger.warning(f"Turma ID {class_id} não encontrada para o usuário ID {current_user_id}.")
        return jsonify({"message": "Turma não encontrada."}), 404

    # Check if user is professor of the class or an enrolled student
    is_professor = (user.role == 'professor' and class_obj.professor_id == user.id)
    is_student = (user.role == 'aluno' and Enrollment.query.filter_by(student_id=user.id, class_id=class_id).first())

    if not (is_professor or is_student):
        current_app.logger.warning(f"Acesso negado aos detalhes da turma ID {class_id} para o usuário ID {current_user_id}. Não é professor nem aluno matriculado.")
        return jsonify({"message": "Acesso negado. Você não tem permissão para acessar esta turma."}), 403

    class_data = class_obj.to_dict()
    professor_name = User.query.get(class_obj.professor_id).name if User.query.get(class_obj.professor_id) else 'Unknown'
    class_data['professor_name'] = professor_name
    enrolled_students = User.query.join(Enrollment).filter(Enrollment.class_id == class_id).all()
    class_data['students'] = [{"id": s.id, "name": s.name} for s in enrolled_students]

    # 2. Lógica para visibilidade do código de inscrição
    if not class_obj.is_enrollment_code_public and not is_professor:
        # Se o código não for público e o usuário não for o professor, remova-o da resposta.
        if 'enrollment_code' in class_data:
            del class_data['enrollment_code']

    # Busca as equipes (Casas) da turma
    teams = Team.query.filter_by(class_id=class_id).all()
    teams_data = []
    
    for team in teams:
        # Busca os membros deste time
        members = User.query.join(Enrollment).filter(Enrollment.team_id == team.id).all()
        teams_data.append({
            "id": team.id,
            "name": team.name,
            "avatar_url": team.avatar_url,
            "members": [
                {
                    "id": m.id, 
                    "name": m.name, 
                    "avatar": m.profile_picture or '/avatars/default_avatar.webp'
                } for m in members
            ]
        })
    
    class_data['teams'] = teams_data
    # Optionally include activities assigned to this class
    assigned_activities = Activity.query.filter_by(class_id=class_id).all()
    class_data['activities'] = [activity.to_dict() for activity in assigned_activities]

    current_app.logger.debug(f"Detalhes da turma ID {class_id} recuperados para o usuário ID {current_user_id}.")
    return jsonify(class_data), 200

@class_bp.route('/<int:class_id>', methods=['PUT'])
@cross_origin()
@jwt_required()
def update_class(class_id):
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"Professor ID {current_user_id} tentando atualizar a turma ID {class_id}.")

    user = User.query.get(current_user_id)
    class_to_update = Class.query.get(class_id)

    if not user or user.role != 'professor':
        current_app.logger.warning(f"Acesso negado para ID {current_user_id} ao tentar atualizar turma ID {class_id}. Role: {user.role if user else 'N/A'}")
        return jsonify({"message": "Acesso negado. Apenas professores podem atualizar turmas."}), 403

    if not class_to_update:
        current_app.logger.error(f"Professor ID {current_user_id} tentou atualizar uma turma inexistente: ID {class_id}")
        return jsonify({"message": "Turma não encontrada."}), 404

    if class_to_update.professor_id != user.id:
        current_app.logger.warning(f"Acesso negado para professor ID {current_user_id} ao tentar atualizar turma ID {class_id}. Não é o criador.")
        return jsonify({"message": "Acesso negado. Você não é o professor responsável por esta turma."}), 403

    data = request.get_json()
    current_app.logger.debug(f"Dados recebidos para atualização da turma ID {class_id}: {data}")

    try:
        class_to_update.name = data.get('name', class_to_update.name)
        class_to_update.description = data.get('description', class_to_update.description)
        if 'is_enrollment_code_public' in data:
            class_to_update.is_enrollment_code_public = bool(data['is_enrollment_code_public'])
        

        db.session.commit()
        current_app.logger.info(f"Turma ID {class_id} atualizada com sucesso pelo professor ID {current_user_id}.")
        return jsonify({"message": "Turma atualizada com sucesso!", "class": class_to_update.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao atualizar turma ID {class_id}: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro interno do servidor durante a atualização da turma: {str(e)}"}), 500

@class_bp.route('/<int:class_id>', methods=['DELETE'])
@cross_origin()
@jwt_required()
def delete_class(class_id):
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"Professor ID {current_user_id} tentando deletar a turma ID {class_id}.")

    user = User.query.get(current_user_id)
    class_to_delete = Class.query.get(class_id)

    # Verificações de Permissão
    if not user or user.role != 'professor':
        current_app.logger.warning(f"Acesso negado para ID {current_user_id} ao tentar deletar turma ID {class_id}. Role: {user.role if user else 'N/A'}")
        return jsonify({"message": "Acesso negado. Apenas professores podem deletar turmas."}), 403

    if not class_to_delete:
        current_app.logger.error(f"Professor ID {current_user_id} tentou deletar uma turma inexistente: ID {class_id}")
        return jsonify({"message": "Turma não encontrada."}), 404

    if class_to_delete.professor_id != user.id:
        current_app.logger.warning(f"Acesso negado para professor ID {current_user_id} ao tentar deletar turma ID {class_id}. Não é o criador.")
        return jsonify({"message": "Acesso negado. Você não é o professor responsável por esta turma."}), 403

    try:
        # 1. Remove Alunos da Turma (Matrículas)
        # Necessário limpar matrículas antes de limpar a turma
        Enrollment.query.filter_by(class_id=class_id).delete()

        # 2. Remove Times da Turma (CORREÇÃO CRÍTICA)
        # Necessário limpar os times, pois eles dependem da turma (Foreign Key)
        Team.query.filter_by(class_id=class_id).delete()

        # 3. Desassocia atividades desta turma
        # Não deletamos a atividade, apenas removemos o vínculo com a turma (class_id = None)
        Activity.query.filter_by(class_id=class_id).update({"class_id": None})
        
        # 4. Finalmente, deleta a Turma
        db.session.delete(class_to_delete)
        db.session.commit()
        
        current_app.logger.info(f"Turma ID {class_id} e suas dependências (Alunos, Times) deletadas com sucesso pelo professor ID {current_user_id}.")
        return jsonify({"message": "Turma deletada com sucesso!"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao deletar turma ID {class_id}: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro interno do servidor durante a deleção da turma: {str(e)}"}), 500

@class_bp.route('/join', methods=['POST'])
@cross_origin()
@jwt_required()
def join_class():
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"Usuário ID {current_user_id} tentando entrar em uma turma.")

    user = User.query.get(current_user_id)

    if not user or user.role != 'aluno':
        current_app.logger.warning(f"Acesso negado para ID {current_user_id} na entrada de turma. Role: {user.role if user else 'N/A'}")
        return jsonify({"message": "Acesso negado. Apenas alunos podem entrar em turmas."}), 403

    data = request.get_json()
    enrollment_code = data.get('enrollment_code')
    current_app.logger.debug(f"Aluno ID {current_user_id} tentou entrar com código: {enrollment_code}")

    if not enrollment_code:
        current_app.logger.warning(f"Tentativa de entrada em turma pelo ID {current_user_id} falhou: código ausente.")
        return jsonify({"message": "Código de inscrição é obrigatório."}), 400

    try:
        class_data, error, status_code = ClassService.join_class(user, enrollment_code)
        
        if error:
            return jsonify(error), status_code
            
        return jsonify({"message": "Matrícula realizada com sucesso!", "class": class_data}), status_code
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao matricular aluno ID {current_user_id} na turma: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro interno do servidor ao matricular na turma: {str(e)}"}), 500

@class_bp.route('/<int:class_id>/leave', methods=['POST'])
@cross_origin()
@jwt_required()
def leave_class(class_id):
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"Usuário ID {current_user_id} tentando sair da turma ID {class_id}.")

    user = User.query.get(current_user_id)

    if not user or user.role != 'aluno':
        current_app.logger.warning(f"Acesso negado para ID {current_user_id} ao sair de turma. Role: {user.role if user else 'N/A'}")
        return jsonify({"message": "Acesso negado. Apenas alunos podem sair de turmas."}), 403

    enrollment_to_delete = Enrollment.query.filter_by(student_id=user.id, class_id=class_id).first()

    if not enrollment_to_delete:
        current_app.logger.warning(f"Aluno ID {current_user_id} não está matriculado na turma ID {class_id}.")
        return jsonify({"message": "Você não está matriculado nesta turma."}), 404

    try:
        db.session.delete(enrollment_to_delete)
        db.session.commit()
        current_app.logger.info(f"Aluno ID {current_user_id} saiu com sucesso da turma ID {class_id}.")
        return jsonify({"message": "Você saiu da turma com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao sair da turma ID {class_id} para o aluno ID {current_user_id}: {str(e)}", exc_info=True)
        return jsonify({"message": f"Erro interno do servidor ao sair da turma: {str(e)}"}), 500


@class_bp.route('/<int:class_id>/activities', methods=['GET'])
@cross_origin()
@jwt_required()
def get_class_activities(class_id):
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"Usuário ID {current_user_id} solicitou atividades para a turma ID {class_id}.")

    user = User.query.get(current_user_id)
    class_obj = Class.query.get(class_id)

    if not user:
        current_app.logger.error(f"Tentativa de listar atividades de turma para usuário inexistente: ID {current_user_id}")
        return jsonify({"message": "Usuário não encontrado."}), 404

    if not class_obj:
        current_app.logger.warning(f"Turma ID {class_id} não encontrada ao listar atividades para o usuário ID {current_user_id}.")
        return jsonify({"message": "Turma não encontrada."}), 404

    # Check if user is professor of the class or an enrolled student
    is_professor = (user.role == 'professor' and class_obj.professor_id == user.id)
    is_student = (user.role == 'aluno' and Enrollment.query.filter_by(student_id=user.id, class_id=class_id).first())

    if not (is_professor or is_student):
        current_app.logger.warning(f"Acesso negado às atividades da turma ID {class_id} para o usuário ID {current_user_id}. Não é professor nem aluno matriculado.")
        return jsonify({"message": "Acesso negado. Você não tem permissão para ver as atividades desta turma."}), 403

    activities = Activity.query.filter_by(class_id=class_id).all()
    activities_data = [activity.to_dict() for activity in activities]
    current_app.logger.info(f"Retornando {len(activities_data)} atividades para a turma ID {class_id} para o usuário ID {current_user_id}.")
    return jsonify(activities_data), 200

# ROTA OTIMIZADA PARA A PÁGINA DE EDIÇÃO
@class_bp.route('/<int:class_id>/management-details', methods=['GET'])
@cross_origin()
@jwt_required()
def get_class_management_details(class_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'professor':
        return jsonify({"message": "Acesso negado."}), 403

    class_obj = Class.query.get(class_id)
    if not class_obj or class_obj.professor_id != user.id:
        return jsonify({"message": "Turma não encontrada ou acesso negado."}), 404

    # 1. Alunos matriculados
    enrolled_students = User.query.join(Enrollment).filter(Enrollment.class_id == class_id).all()
    students_data = [{"id": s.id, "name": s.name, "email": s.email} for s in enrolled_students]

    # 2. Atividades já associadas a esta turma
    assigned_activities_query = Activity.query.filter_by(class_id=class_id).all()
    assigned_activities_data = [{"id": a.id, "title": a.title} for a in assigned_activities_query]

    # 3. Atividades do professor que NÃO estão associadas a esta turma
    unassigned_activities_query = Activity.query.filter(
        Activity.professor_id == user.id,
        Activity.class_id.is_(None)
    ).all()
    unassigned_activities_data = [{"id": a.id, "title": a.title} for a in unassigned_activities_query]
    
    response_data = {
        "details": class_obj.to_dict(),
        "students": students_data,
        "assigned_activities": assigned_activities_data,
        "available_activities": unassigned_activities_data
    }
    
    return jsonify(response_data), 200

# ADICIONAR ALUNO PELO E-MAIL
@class_bp.route('/<int:class_id>/students', methods=['POST'])
@cross_origin()
@jwt_required()
def add_student_to_class(class_id):
    current_user_id = get_jwt_identity()
    professor = User.query.get(current_user_id)
    class_obj = Class.query.get(class_id)

    if not professor or professor.role != 'professor' or class_obj.professor_id != professor.id:
        return jsonify({"message": "Acesso negado."}), 403

    data = request.get_json()
    student_email = data.get('email')
    if not student_email:
        return jsonify({"message": "E-mail do aluno é obrigatório."}), 400

    student_to_add = User.query.filter_by(email=student_email).first()
    if not student_to_add:
        return jsonify({"message": f"Nenhum usuário encontrado com o e-mail '{student_email}'."}), 404
    
    if student_to_add.role != 'aluno':
        return jsonify({"message": "O e-mail fornecido não pertence a um aluno."}), 400

    # Verifica se o aluno já está matriculado
    existing_enrollment = Enrollment.query.filter_by(student_id=student_to_add.id, class_id=class_id).first()
    if existing_enrollment:
        return jsonify({"message": "Este aluno já está na turma."}), 409

    try:
        new_enrollment = Enrollment(student_id=student_to_add.id, class_id=class_id)
        db.session.add(new_enrollment)
        db.session.commit()
        return jsonify({
            "message": f"Aluno '{student_to_add.name}' adicionado com sucesso!",
            "student": {"id": student_to_add.id, "name": student_to_add.name, "email": student_to_add.email}
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

# REMOVER ALUNO DA TURMA
@class_bp.route('/<int:class_id>/students/<int:student_id>', methods=['DELETE'])
@cross_origin()
@jwt_required()
def remove_student_from_class(class_id, student_id):
    current_user_id = get_jwt_identity()
    professor = User.query.get(current_user_id)
    class_obj = Class.query.get(class_id)

    if not professor or professor.role != 'professor' or class_obj.professor_id != professor.id:
        return jsonify({"message": "Acesso negado."}), 403
    
    enrollment = Enrollment.query.filter_by(student_id=student_id, class_id=class_id).first()
    if not enrollment:
        return jsonify({"message": "Matrícula não encontrada."}), 404

    try:
        db.session.delete(enrollment)
        db.session.commit()
        return jsonify({"message": "Aluno removido da turma com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

# ASSOCIAR ATIVIDADE EXISTENTE À TURMA
@class_bp.route('/<int:class_id>/activities', methods=['POST'])
@cross_origin()
@jwt_required()
def add_activity_to_class(class_id):
    current_user_id = get_jwt_identity()
    professor = User.query.get(current_user_id)
    class_obj = Class.query.get(class_id)

    if not professor or professor.role != 'professor' or class_obj.professor_id != professor.id:
        return jsonify({"message": "Acesso negado."}), 403

    data = request.get_json()
    activity_id = data.get('activity_id')
    if not activity_id:
        return jsonify({"message": "ID da atividade é obrigatório."}), 400

    activity = Activity.query.get(activity_id)
    if not activity or activity.professor_id != professor.id:
        return jsonify({"message": "Atividade não encontrada ou não pertence a você."}), 404

    if activity.class_id:
        return jsonify({"message": "Esta atividade já está associada a outra turma."}), 409

    try:
        activity.class_id = class_id
        db.session.commit()
        return jsonify({
            "message": "Atividade associada com sucesso!",
            "activity": {"id": activity.id, "title": activity.title}
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

# DESASSOCIAR ATIVIDADE DA TURMA
@class_bp.route('/<int:class_id>/activities/<int:activity_id>', methods=['DELETE'])
@cross_origin()
@jwt_required()
def remove_activity_from_class(class_id, activity_id):
    current_user_id = get_jwt_identity()
    professor = User.query.get(current_user_id)
    class_obj = Class.query.get(class_id)

    if not professor or professor.role != 'professor' or class_obj.professor_id != professor.id:
        return jsonify({"message": "Acesso negado."}), 403

    activity = Activity.query.get(activity_id)
    if not activity or activity.class_id != class_obj.id:
        return jsonify({"message": "Atividade não encontrada nesta turma."}), 404

    try:
        activity.class_id = None
        db.session.commit()
        return jsonify({"message": "Atividade desassociada com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500
    
    
@class_bp.route('/<int:class_id>/teams/generate', methods=['POST'])
@cross_origin()
@jwt_required()
def generate_teams(class_id):
    current_user_id = get_jwt_identity()
    professor = User.query.get(current_user_id)
    class_obj = Class.query.get(class_id)

    if not professor or professor.role != 'professor' or class_obj.professor_id != professor.id:
        return jsonify({"message": "Acesso negado."}), 403
    
    data = request.get_json()
    num_teams = int(data.get('quantity', 4))
    custom_names = data.get('names', [])
    method = data.get('method', 'random')

    try:
        had_students = ClassService.generate_teams(class_id, num_teams, custom_names, method)
        msg = "Casas criadas com sucesso!" if not had_students else "Casas criadas e alunos distribuídos!"
        return jsonify({"message": msg}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500
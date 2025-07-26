from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, current_user
from .. import db
from ..models import User, Activity

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard_data', methods=['GET'])
@jwt_required()
def get_admin_dashboard_data():
    app.logger.info(f"Usuário ID {current_user.id} (Role: {current_user.role}) acessando dashboard de admin.")
    if current_user.role != 'admin':
        app.logger.warning(f"Acesso negado ao dashboard de admin para o usuário ID {current_user.id}.")
        return jsonify({"msg": "Acesso não autorizado: Apenas administradores podem acessar estes dados."}), 403

    total_users = User.query.count()
    total_professors = User.query.filter_by(role='professor').count()
    total_students = User.query.filter_by(role='aluno').count()
    total_activities = Activity.query.count()
    total_visits = 12345  # Valor mockado para visitas

    dashboard_data = {
        "total_users": total_users,
        "total_professors": total_professors,
        "total_students": total_students,
        "total_activities": total_activities,
        "total_visits": total_visits
    }
    app.logger.debug(f"Dados do dashboard de admin: {dashboard_data}")
    return jsonify(dashboard_data), 200

# Rota para deletar um usuário
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    app.logger.info(f"Admin ID {current_user.id} tentando deletar o usuário ID {user_id}.")
    if current_user.role != 'admin':
        app.logger.warning(f"Acesso negado para admin ID {current_user.id} ao tentar deletar usuário ID {user_id}.")
        return jsonify({"msg": "Acesso não autorizado: Apenas administradores podem deletar contas de usuário."}), 403

    user_to_delete = User.query.get(user_id)
    if not user_to_delete:
        app.logger.error(f"Admin ID {current_user.id} tentou deletar um usuário inexistente: ID {user_id}")
        return jsonify({"msg": "User not found"}), 404

    try:
        db.session.delete(user_to_delete)
        db.session.commit()
        app.logger.info(f"Usuário ID {user_id} deletado com sucesso pelo admin ID {current_user.id}.")
        return jsonify({"msg": "Usuário deletado com sucesso"}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erro ao deletar usuário ID {user_id}: {e}", exc_info=True)
        return jsonify({"msg": "Erro interno do servidor durante a deleção do usuário"}), 500

# Rota para listar todas as atividades
@admin_bp.route('/activities', methods=['GET'])
@jwt_required()
def get_all_activities():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return jsonify({"message": "Acesso não autorizado"}), 403

    activities = Activity.query.all()
    return jsonify([a.to_dict() for a in activities]), 200


# Rota para atualizar um usuário
@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    app.logger.info(f"Admin ID {current_user.id} tentando atualizar o usuário ID {user_id}.")
    if current_user.role != 'admin':
        app.logger.warning(f"Acesso negado para admin ID {current_user.id} ao tentar atualizar usuário ID {user_id}.")
        return jsonify({"msg": "Acesso não autorizado: Apenas administradores podem atualizar dados de usuários."}), 403

    user_to_update = User.query.get(user_id)
    if not user_to_update:
        app.logger.error(f"Admin ID {current_user.id} tentou atualizar um usuário inexistente: ID {user_id}")
        return jsonify({"msg": "Usuário não encontrado"}), 404

    data = request.get_json()
    app.logger.debug(f"Dados recebidos para atualização do usuário ID {user_id}: {data}")

    try:
        user_to_update.name = data.get('name', user_to_update.name)
        user_to_update.email = data.get('email', user_to_update.email)
        user_to_update.role = data.get('role', user_to_update.role)
        user_to_update.institution_name = data.get('institution_name', user_to_update.institution_name)
        user_to_update.discipline = data.get('discipline', user_to_update.discipline)
        
        db.session.commit()
        app.logger.info(f"Usuário ID {user_id} atualizado com sucesso pelo admin ID {current_user.id}.")
        return jsonify({"msg": "Usuário atualizado com sucesso", "user": user_to_update.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Erro ao atualizar usuário ID {user_id}: {e}", exc_info=True)
        return jsonify({"msg": "Erro interno do servidor durante a atualização do usuário"}), 500

# Rota para listar todos os usuários
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return jsonify({"message": "Acesso não autorizado"}), 403

    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200

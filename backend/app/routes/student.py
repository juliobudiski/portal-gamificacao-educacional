"""
Módulo de Rotas do Aluno (Student)
Responsável por fornecer os dados agregados para o dashboard do aluno,
incluindo turmas, atividades atribuídas, medalhas conquistadas e progresso geral.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
# Importe o SQLAlchemy para usar funções de join mais avançadas, se necessário nos services
from .. import db 
from ..models import User, Class, Enrollment, Activity, ActivityProgress, UserUnlockedMedal
from flask_cors import cross_origin


from ..services.student_service import StudentService

student_bp = Blueprint('student', __name__)

@student_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@cross_origin()
def student_dashboard():
    """
    Recupera as informações principais para preencher o Dashboard do Aluno.
    - Acesso: Apenas usuários com a role 'aluno'.
    - Retorno: Estatísticas resumidas (turmas cadastradas, próximas atividades, medalhas recentes, etc).
    - Lógica de Agregação: Isolada no StudentService para facilitar manutenção.
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    # Validação de Role: Segurança adicional garantindo que um professor não acesse
    # endpoints exclusivos de visualização do aluno, evitando dados inconsistentes.
    if not user or user.role != 'aluno':
        return jsonify({"message": "Acesso não autorizado"}), 403

    dashboard_data = StudentService.get_dashboard_data(user)
    return jsonify(dashboard_data), 200


@student_bp.route('/activities/all', methods=['GET'])
@jwt_required()
@cross_origin()
def get_all_student_activities():
    """
    [Arquitetura]
    Por que: O acesso direto ao modelo User acopla o controller ao banco. 
    Delegando o ID do usuário diretamente para o Service centralizamos a recuperação do usuário 
    e regras de autorização em um só lugar.
    """
    current_user_id = get_jwt_identity()
    
    result, error, status_code = StudentService.get_all_activities_by_id(current_user_id)
    if error:
        return jsonify(error), status_code
    return jsonify(result), status_code
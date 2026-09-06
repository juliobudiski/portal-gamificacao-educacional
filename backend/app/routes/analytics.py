"""
Módulo de Rotas de Analytics
Responsável por fornecer dados analíticos para professores (ex: desempenho dos alunos)
e gerenciar submissão/elegibilidade de feedbacks dos alunos.
"""

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.analytics_service import AnalyticsService

# O prefixo registrado no __init__.py é '/api/analytics'
analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/professor/filters', methods=['GET'])
@jwt_required()
def get_professor_filters():
    """
    Recupera as opções de filtro disponíveis para o dashboard de analytics do professor.
    - Acesso: Somente professores autenticados (verificado no Service).
    - Retorno: Listas de 'classes' (turmas) e 'activities' (atividades) do professor
      para popular dropdowns de filtros no frontend.
    """
    current_user_id = get_jwt_identity()
    result, error, status = AnalyticsService.get_professor_filters(current_user_id)
    if error:
        return jsonify(error), status
    return jsonify(result), status


@analytics_bp.route('/professor/performance', methods=['GET'])
@jwt_required()
def get_student_performance():
    """
    Recupera as métricas de performance dos alunos (notas, progresso, etc).
    - Acesso: Somente professores autenticados.
    - Params URL: 
      - class_id (opcional): Filtra por turma.
      - activity_id (opcional): Filtra por atividade.
      - search (opcional): Filtra pelo nome/email do aluno.
    - Retorno: Lista de alunos com suas respectivas performances nas atividades.
    """
    class_id = request.args.get('class_id')
    activity_id = request.args.get('activity_id')
    search_term = request.args.get('search')
    
    result, error, status = AnalyticsService.get_student_performance(class_id, activity_id, search_term)
    if error:
        return jsonify(error), status
    return jsonify(result), status
    
@analytics_bp.route('/feedback/check-eligibility', methods=['GET'])
@jwt_required()
def check_feedback_eligibility():
    """
    [Arquitetura]
    Por que: Isola a verificação de regras de elegibilidade (que podem ser complexas e envolver múltiplas tabelas)
    na camada de AnalyticsService. A rota atua puramente como interface de entrada HTTP.
    
    Verifica se um aluno está elegível para deixar um feedback global da plataforma.
    Por exemplo, ele pode ser elegível apenas se concluiu X atividades ou não enviou feedback recentemente.
    - Acesso: Alunos autenticados.
    - Retorno: { "eligible": bool, "reason": "str" }
    """
    user_id = get_jwt_identity()
    result, error, status = AnalyticsService.check_feedback_eligibility(user_id)
    if error:
        return jsonify(error), status
    return jsonify(result), status

@analytics_bp.route('/feedback/submit', methods=['POST'])
@jwt_required()
def submit_feedback():
    """
    Recebe e salva um feedback estruturado submetido por um aluno.
    - Acesso: Alunos autenticados.
    - Payload JSON esperado: { "rating": int, "comment": "str", ... }
    - Retorno: Mensagem de sucesso ao salvar o feedback.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    result, error, status = AnalyticsService.submit_feedback(user_id, data)
    if error:
        return jsonify(error), status
    return jsonify(result), status
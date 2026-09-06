"""
Módulo de Rotas de Rankings (Gamificação Social)
Responsável por gerar quadros de líderes (leaderboards), comparando 
o desempenho e a criação de conteúdo dos usuários na plataforma.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, Activity
from flask_cors import cross_origin
from ..services.ranking_service import RankingService
import logging

# Instancia o Blueprint
rankings_bp = Blueprint('rankings_bp', __name__)
logger = logging.getLogger(__name__)

@rankings_bp.route('/teachers/creators', methods=['GET'])
@jwt_required()
@cross_origin()
def get_teacher_creators_ranking():
    """
    [Arquitetura]
    Por que: Agregação de rankings frequentemente exige queries pesadas e uso de cache. Mantendo a lógica
    isolada no RankingService, a rota (Controller) fica enxuta e desacoplada das complexidades de performance e BD.
    """
    current_user_id = get_jwt_identity()
    
    # A lógica de agregação do ranking está isolada no service para otimização e cache, se necessário futuramente.
    top_10_ranking, error = RankingService.get_teacher_creators_ranking(current_user_id)
    
    if error:
        return jsonify({"message": error}), 500
        
    return jsonify(ranking=top_10_ranking), 200


@rankings_bp.route('/test', methods=['GET'])
@cross_origin() # Mantemos o cross_origin para testar o CORS e as rotas abertas.
def test_route():
    """
    Rota de diagnóstico de conectividade e validação do Blueprint de rankings.
    - Utilizada durante troubleshooting para confirmar que o roteamento e o CORS estão saudáveis.
    """
    print("!!! ROTA DE TESTE ACESSADA COM SUCESSO !!!")
    return jsonify({"message": "Olá Mundo, a rota de teste do ranking funciona!"})
# backend/app/routes/rankings.py

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, Activity
from flask_cors import cross_origin
from ..services.ranking_service import RankingService
import logging

# --- ALTERAÇÃO AQUI ---
# Adicionamos o prefixo /api diretamente aqui para garantir que a rota completa seja /api/rankings
rankings_bp = Blueprint('rankings_bp', __name__)
logger = logging.getLogger(__name__)

# O resto do arquivo permanece o mesmo, mas a rota agora será construída a partir do novo prefixo.
# O URL final será: /api/rankings/teachers/creators
@rankings_bp.route('/teachers/creators', methods=['GET'])
@jwt_required()
@cross_origin()
def get_teacher_creators_ranking():
    """
    Endpoint para obter o ranking de professores que mais criaram atividades.
    Retorna o Top 10 e a posição do usuário logado.
    """
    current_user_id = get_jwt_identity()
    
    top_10_ranking, error = RankingService.get_teacher_creators_ranking(current_user_id)
    
    if error:
        return jsonify({"message": error}), 500
        
    return jsonify(ranking=top_10_ranking), 200


@rankings_bp.route('/test', methods=['GET'])
@cross_origin() # Mantemos o cross_origin para testar o CORS
def test_route():
    """ Rota de teste super simples para verificar o Blueprint e o CORS. """
    print("!!! ROTA DE TESTE ACESSADA COM SUCESSO !!!")
    return jsonify({"message": "Olá Mundo, a rota de teste do ranking funciona!"})
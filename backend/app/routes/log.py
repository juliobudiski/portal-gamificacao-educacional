"""
Módulo de Rotas de Logs (Log)
Responsável por capturar e persistir eventos de telemetria, engajamento e ações 
do usuário na plataforma (ex: views em etapas, cliques em ajuda, abandonos de tela).
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from ..services.log_service import LogService

log_bp = Blueprint('log', __name__)

@log_bp.route('/event', methods=['POST'])
@cross_origin()
@jwt_required()
def log_event():
    """
    [Arquitetura]
    Por que: O Controller de log atua apenas como "coletor" HTTP. Delegando os metadados (IP, User-Agent) 
    e payload ao LogService, evitamos o acoplamento da API com as regras de normalização de lotes (batch) e inserção no banco.
    """
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Passa os dados brutos e metadados HTTP (IP, User-Agent) para a camada de serviço.
    # O serviço se encarrega de normalizar se é batch (lista) ou single (dicionário).
    result, status = LogService.log_events(
        current_user_id, 
        data, 
        request.remote_addr, 
        request.headers.get("User-Agent")
    )
    
    return jsonify(result), status

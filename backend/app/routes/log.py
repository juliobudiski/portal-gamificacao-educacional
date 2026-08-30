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
    Endpoint para gravação de logs (telemetria de uso).
    - Acesso: Requer Autenticação (jwt_required).
    - Payload JSON: Pode receber um objeto de evento único {section, action, details, activity_id?} 
      ou um lote de eventos {events: [...] } (para reduzir tráfego de rede).
    - Funcionalidade: Registra as ações do usuário (ex: tempo que gastou criando uma atividade)
      no banco de dados. Os logs são processados no backend para evitar que o frontend dependa da resposta.
    - Retorno: Confirmação de recebimento (200 OK) com formato { "message": "Log(s) registrado(s)" }
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

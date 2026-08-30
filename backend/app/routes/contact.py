"""
Módulo de Rotas de Contato (Contact)
Responsável por gerenciar o endpoint de recebimento de mensagens
enviadas pela página de "Fale Conosco".
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from ..services.contact_service import ContactService

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/', methods=['POST'])
def send_message():
    """
    Rota para envio de mensagem de contato.
    - Acesso: Público (se o usuário estiver deslogado) ou Autenticado (se logado).
    - Payload JSON esperado: { "name": "str", "email": "str", "subject": "str", "message": "str" }
    - Retorno: Mensagem de sucesso ou erro (201, 400).
    """
    data = request.get_json()
    
    user_id = None
    try:
        # Tenta verificar se a requisição possui um JWT válido sem forçar o erro
        # (optional=True permite que usuários não logados também enviem mensagens)
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
        if current_user_id:
            user_id = current_user_id
    except Exception as e:
        # Se ocorrer falha silenciosa na leitura do token, registramos no log, mas permitimos o fluxo
        from flask import current_app
        current_app.logger.debug(f"Falha opcional de JWT em contact: {e}")

    # Delega o processamento e salvamento da mensagem para a camada de serviço
    result, status = ContactService.send_message(user_id, data)
    return jsonify(result), status
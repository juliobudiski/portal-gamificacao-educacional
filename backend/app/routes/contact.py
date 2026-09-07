"""
Módulo de Rotas de Contato (Contact)
Responsável por gerenciar o endpoint de recebimento de mensagens
enviadas pela página de "Fale Conosco".
"""

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from ..services.contact_service import ContactService

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('', methods=['POST'], strict_slashes=False)
@contact_bp.route('/', methods=['POST'], strict_slashes=False)
@cross_origin()
def send_message():
    """
    [Arquitetura]
    Por que: O Controller intercepta a autorização híbrida (anônima ou autenticada) sem quebrar o fluxo.
    A lógica de persistência e validação da mensagem real vai para o ContactService, garantindo coesão.
    
    Rota para envio de mensagem de contato (incluindo solicitação de chave de professor).
    - Acesso: Totalmente público. Usuários deslogados ou sem token podem enviar mensagens.
    - Payload JSON esperado: { "name": "str", "email": "str", "subject": "str", "message": "str" }
    - Retorno: Mensagem de sucesso ou erro (201, 400).
    """
    data = request.get_json()
    
    user_id = None
    auth_header = request.headers.get('Authorization', '')
    
    import sys
    import traceback
    from flask import current_app

    try:
        # Blindagem: só tenta ler JWT se o header contiver um Bearer token de formato minimamente válido (3 segmentos)
        if auth_header and auth_header.startswith('Bearer '):
            token_candidate = auth_header.split(' ', 1)[1].strip()
            if (
                token_candidate
                and token_candidate not in ('null', 'undefined', 'None', '')
                and token_candidate.count('.') == 2
            ):
                try:
                    verify_jwt_in_request(optional=True)
                    current_user_id = get_jwt_identity()
                    if current_user_id:
                        user_id = current_user_id
                except Exception as e:
                    current_app.logger.debug(f"Falha ao validar token opcional em contact: {e}")

        # Delega o processamento e salvamento da mensagem para a camada de serviço
        result, status = ContactService.send_message(user_id, data)
        return jsonify(result), status
    except Exception as e:
        error_trace = traceback.format_exc()
        sys.stderr.write(f"\n[CRITICAL CONTACT API ERROR]\n{error_trace}\n")
        sys.stderr.flush()
        current_app.logger.error(f"[CONTACT API FAILURE] {str(e)}:\n{error_trace}")
        return jsonify({
            "error": str(e),
            "trace": error_trace
        }), 500
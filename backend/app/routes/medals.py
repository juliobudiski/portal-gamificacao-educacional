"""
Módulo de Rotas de Medalhas (Medals)
Responsável por listar todas as medalhas disponíveis no sistema e 
permitir que os usuários consultem as medalhas que já desbloquearam.
Também centraliza o dicionário de gatilhos de validação de medalhas.
"""

from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Medal, UserUnlockedMedal, User, ActivityProgress, StudentResponse, Activity

medals_bp = Blueprint('medals', __name__)

# ==============================================================================
# ROTAS DA API
# ==============================================================================

@medals_bp.route('', methods=['GET'])
@jwt_required()
def get_all_medals():
    """
    Retorna uma lista de todas as medalhas existentes na plataforma (o catálogo global).
    - Acesso: Autenticado.
    - Retorno: Array de objetos detalhando cada medalha, sua imagem, descrição e tipo.
    """
    medals = Medal.query.order_by(Medal.type, Medal.name).all()
    
    # --- INÍCIO DA CORREÇÃO ---
    # Adicionamos uma barra '/' no início do image_url se ela não existir.
    # Isso previne erros de renderização de caminhos relativos no frontend.
    medals_data = [{
        "id": medal.id,
        "name": medal.name,
        "description": medal.description,
        "imageUrl": f"/{medal.image_url.lstrip('/')}", # Garante que o caminho comece com /
        "type": medal.type,
        "notes": medal.notes
    } for medal in medals]
    # --- FIM DA CORREÇÃO ---
    
    return jsonify(medals_data), 200

@medals_bp.route('/my-unlocked', methods=['GET'])
@jwt_required()
def get_my_unlocked_medals():
    """
    [Arquitetura]
    Por que: As queries de medalhas desbloqueadas misturavam lógica de banco e HTTP.
    O MedalService agora encapsula as regras de persistência e filtros condicionais (activity_id).
    """
    user_id = get_jwt_identity()
    activity_id = request.args.get('activity_id', type=int)
    
    # Importação local temporária para evitar quebra caso falte importação no topo
    from ..services.medal_service import MedalService
    return jsonify(MedalService.get_my_unlocked_medals_service(user_id, activity_id)), 200

# ==============================================================================
# MAPA DE VERIFICAÇÃO DE MEDALHAS
# ==============================================================================
# Este dicionário mapeia o NOME da medalha (como está no DB) para a FUNÇÃO
# que verifica se ela deve ser desbloqueada.
# Isso torna o sistema de gatilhos centralizado e fácil de expandir (Strategy Pattern).
# ------------------------------------------------------------------------------
def _check_medal_explorador(*args, **kwargs): pass
def _check_medal_inspetor(*args, **kwargs): pass
def _check_medal_velocista(*args, **kwargs): pass
def _check_medal_fenix(*args, **kwargs): pass

MEDAL_CHECK_FUNCTIONS = {
    # Medalhas de Atividade
    "Medalha do Explorador": _check_medal_explorador,
    "Medalha do Inspetor": _check_medal_inspetor,
    "Medalha do Velocista": _check_medal_velocista,
    "Medalha \"Fênix\"": _check_medal_fenix
}
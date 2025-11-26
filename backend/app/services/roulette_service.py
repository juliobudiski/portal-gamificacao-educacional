# Exemplo de lógica no Service ou Route do Flask
from flask import session, jsonify
from app.models import User, Prize, UserItem

def spin_roulette_logic(user, is_retry=False):
    # 1. Verificação de Custo (apenas se NÃO for retry)
    if not is_retry:
        if not user.can_spin_today: # Sua lógica de cooldown diário
            return {"error": "Já girou hoje"}, 400
        # Se tiver custo de moeda, debita aqui

    # 2. Verificação de Segurança do Retry
    if is_retry and not session.get('roulette_retry_available'):
        return {"error": "Retry não autorizado"}, 403

    # 3. Sorteio (Lógica de Pesos)
    prize = select_random_prize_weighted() 

    # 4. Verificação de Duplicidade (Core da mudança)
    is_duplicate = False
    
    # Se for Avatar ou Título, verifica se já tem
    if prize.type in ['avatar', 'title']:
        user_has_item = UserItem.query.filter_by(user_id=user.id, item_id=prize.id).first()
        
        if user_has_item:
            is_duplicate = True
            # ATENÇÃO: Se for duplicate, NÃO salva o prêmio, mas autoriza o retry
            session['roulette_retry_available'] = True
            
            return {
                "prize": {
                    "label": prize.name,
                    "type": prize.type,
                    "is_duplicate": True # Flag para o frontend
                },
                "message": "Item repetido! Gire novamente."
            }

    # 5. Consolidação (Se não for duplicado)
    # Adiciona XP ou Item ao usuário
    give_prize_to_user(user, prize)
    
    # Limpa a flag de retry se o giro foi bem sucedido (item novo ou XP)
    session.pop('roulette_retry_available', None)
    
    return {
        "prize": {
            "label": prize.name,
            "type": prize.type,
            "value": prize.value,
            "is_duplicate": False
        }
    }
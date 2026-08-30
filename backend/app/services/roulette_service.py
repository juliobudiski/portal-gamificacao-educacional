import secrets
from datetime import datetime
from app.models import db, Title, UserUnlockedTitle, RouletteWin, SlotWin
from sqlalchemy.orm.attributes import flag_modified

# Configuração dos Símbolos (Emojis) e Pesos do Caça-Níqueis
SLOT_SYMBOLS = {
    "orange":  {"icon": "🍊", "weight": 40, "multiplier": 2},  # Comum
    "bell":    {"icon": "🔔", "weight": 30, "multiplier": 5},  # Médio
    "diamond": {"icon": "💎", "weight": 15, "multiplier": 10}, # Raro
    "wild":    {"icon": "🐯", "weight": 5,  "multiplier": 50}, # Jackpot (Tigre)
    "bomb":    {"icon": "💣", "weight": 10, "multiplier": 0},  # Perda (ajuda a diluir)
}

PAYLINES = [
    [(0,0), (0,1), (0,2)], # Linha Topo
    [(1,0), (1,1), (1,2)], # Linha Meio
    [(2,0), (2,1), (2,2)], # Linha Baixo
    [(0,0), (1,1), (2,2)], # Diagonal \
    [(2,0), (1,1), (0,2)], # Diagonal /
]

def spin_roulette(user, progress, activity_id, is_retry=False):
    # --- [MODO TESTE] COOLDOWN DESATIVADO ---
    # Para ativar o cooldown diário, remova a checagem is_retry
    if not is_retry and progress.last_spin_date:
        last_spin = progress.last_spin_date.date()
        today = datetime.utcnow().date()
        if last_spin == today:
            return {"error": "Você já girou a roleta hoje! Volte amanhã.", "status": 400}

    # --- LISTA DE PRÊMIOS (XP -> MOEDAS) ---
    prizes = [
        {"type": "coins", "value": 50, "label": "50 Moedas"},
        {"type": "coins", "value": 100, "label": "100 Moedas"},
        {"type": "coins", "value": 150, "label": "150 Moedas"},
        {"type": "title", "value": "TITLE_LUCKY", "label": "Título: O Sortudo"},
        {"type": "avatar", "value": {"url": "/avatars/avatar_special.webp", "name": "Sortudo", "promotable": True}, "label": "Avatar Raro!"},
    ]

    prize_weights = [20, 20, 20, 10, 10] 
    prize = None
    attempts = 0
    unlocked_avatar_urls = [av['url'] for av in (progress.unlocked_activity_avatars or []) if isinstance(av, dict)]

    while attempts < 20:
        secure_random = secrets.SystemRandom()
        selected_prize = secure_random.choices(prizes, weights=prize_weights, k=1)[0]
        if selected_prize['type'] == 'avatar':
            if selected_prize['value']['url'] not in unlocked_avatar_urls:
                prize = selected_prize
                break
        else:
            prize = selected_prize
            break
        attempts += 1
    
    if not prize: prize = prizes[0]

    is_duplicate = False
    if prize['type'] == 'avatar':
        if prize['value']['url'] in unlocked_avatar_urls:
            is_duplicate = True
    elif prize['type'] == 'title':
        effect_id = prize['value']
        title_obj = Title.query.filter_by(effect_id=effect_id).first()
        if not title_obj:
            title_obj = Title(effect_id=effect_id, display_text="O Sortudo", description="Concedido pela Roda da Fortuna.")
            db.session.add(title_obj)
            db.session.flush()
        existing_unlock = UserUnlockedTitle.query.filter_by(user_id=user.id, activity_id=activity_id, title_id=title_obj.id).first()
        if existing_unlock:
            is_duplicate = True

    if is_duplicate:
        return {
            "duplicate": True,
            "message": "Item repetido! Gire novamente.",
            "prize": {"label": prize['label'], "type": prize['type'], "is_duplicate": True}
        }

    # Consolidação
    if prize['type'] == 'coins':
        progress.coins = (progress.coins or 0) + prize['value']
        progress.points_earned = (progress.points_earned or 0) + prize['value']
        progress.total_xp_earned = (progress.total_xp_earned or 0) + prize['value']
    elif prize['type'] == 'avatar':
        if progress.unlocked_activity_avatars is None: progress.unlocked_activity_avatars = []
        progress.unlocked_activity_avatars.append(prize['value'])
        flag_modified(progress, "unlocked_activity_avatars")
    elif prize['type'] == 'title':
        title_obj = Title.query.filter_by(effect_id=prize['value']).first()
        new_unlock = UserUnlockedTitle(user_id=user.id, activity_id=activity_id, title_id=title_obj.id)
        db.session.add(new_unlock)
        progress.equipped_title_id = title_obj.id

    progress.last_spin_date = datetime.utcnow()
    new_win = RouletteWin(user_id=user.id, activity_id=activity_id, prize_label=prize['label'])
    db.session.add(new_win)
    db.session.commit()

    return {
        "duplicate": False,
        "message": f"Você ganhou {prize['label']}!", 
        "prize": {"label": prize['label'], "type": prize['type'], "is_duplicate": False}
    }


def play_slot(user, progress, activity_id, bet_cost=10):
    current_coins = progress.coins or 0
    if current_coins < bet_cost:
        return {"error": f"Saldo insuficiente. Custo: {bet_cost} moedas.", "status": 400}

    progress.coins = current_coins - bet_cost
    
    keys = list(SLOT_SYMBOLS.keys())
    weights = [SLOT_SYMBOLS[k]['weight'] for k in keys]
    
    matrix = []
    for _ in range(3):
        secure_random = secrets.SystemRandom()
        row = secure_random.choices(keys, weights=weights, k=3)
        matrix.append(row)

    total_win = 0
    winning_lines = []
    
    for line_index, coords in enumerate(PAYLINES):
        s1 = matrix[coords[0][0]][coords[0][1]]
        s2 = matrix[coords[1][0]][coords[1][1]]
        s3 = matrix[coords[2][0]][coords[2][1]]
        
        if s1 == s2 == s3 or (s1 == s2 and s3 == 'wild') or (s1 == 'wild' and s2 == s3):
            winner_symbol = s1 if s1 != 'wild' else s2
            if winner_symbol == 'bomb': continue

            win_amount = bet_cost * SLOT_SYMBOLS[winner_symbol]['multiplier']
            total_win += win_amount
            winning_lines.append({"line_index": line_index, "symbol": winner_symbol, "amount": win_amount})

    if total_win > 0:
        progress.coins += total_win
        progress.total_xp_earned = (progress.total_xp_earned or 0) + total_win
        progress.points_earned = (progress.points_earned or 0) + total_win
        if total_win >= 50: 
            new_win = SlotWin(user_id=user.id, activity_id=activity_id, prize_description=f"{total_win} Moedas")
            db.session.add(new_win)

    db.session.commit()
    return {
        "matrix": matrix,
        "total_win": total_win,
        "winning_lines": winning_lines,
        "is_jackpot": total_win >= (bet_cost * 20)
    }
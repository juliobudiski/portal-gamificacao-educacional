# backend/app/routes/progress.py
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Title, UserUnlockedTitle, Purchase, StoreItem, User, ActivityProgress, Activity, StudentResponse, EventLog, RouletteWin, SlotWin, Enrollment, Team
from sqlalchemy.orm import joinedload
from flask_cors import cross_origin 
progress_bp = Blueprint('progress', __name__)
from datetime import datetime, timedelta # Adicione timedelta
import random # Adicione random
from sqlalchemy.orm.attributes import flag_modified
from .medals import check_and_award_medals
import json
def xp_for_next_level(level):
    """Calcula o XP necessário para o próximo nível com base no nível atual."""
    # Nível 1 -> 100, Nível 2 -> 150, Nível 3 -> 200, etc.
    return 100 + (level - 1) * 50

def calculate_level(total_points):
    """Calcula o nível atual, o XP para o próximo nível e o XP acumulado até o nível atual."""
    level = 1
    xp_required_for_current_level = 0
    xp_needed = xp_for_next_level(level)

    if total_points is None:
        total_points = 0

    while total_points >= xp_needed:
        total_points -= xp_needed
        xp_required_for_current_level += xp_needed
        level += 1
        xp_needed = xp_for_next_level(level)
    
    return {
        "level": level,
        "xpForNextLevel": xp_needed,
        "xpEarnedForCurrentLevel": total_points,
        "xpAccumulatedUntilCurrentLevel": xp_required_for_current_level
    }

def _get_progress_json(user_id, activity_id):
    """
    Função auxiliar que busca, calcula e retorna o JSON
    completo do progresso de um aluno para uma atividade.
    (Agora retorna um DICIONÁRIO ou levanta uma EXCEÇÃO)
    """
    user = User.query.get(user_id)
    if not user or user.role != 'aluno':
        # Erro de permissão
        raise Exception("Acesso negado: Apenas alunos podem ver o progresso.")

    # Busca o progresso e a atividade
    progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()
    activity = Activity.query.get(activity_id)
    if not activity:
        raise Exception("Atividade não encontrada.")

    # Validações de data
    now = datetime.utcnow()
    if activity.available_from and now < activity.available_from:
        raise Exception(f"Esta atividade estará disponível em {activity.available_from.strftime('%d/%m/%Y às %H:%M')}.")
    
    if activity.expires_at and now > activity.expires_at:
        raise Exception("O prazo para esta atividade já encerrou.")
    
    # Se o progresso não existir, cria um registro inicial para o aluno
    if not progress:
        current_app.logger.info(f"Nenhum progresso encontrado para o usuário {user.id}. Criando novo registro para a turma {activity.class_id}.")
        progression_path = activity.gamification_design.get('progression_path', [])
        first_step_id = progression_path[0]['id'] if progression_path else None
        progress = ActivityProgress(
            student_id=user.id,
            activity_id=activity.id,
            class_id=activity.class_id,
            status='in_progress'
        )
        db.session.add(progress)
        db.session.commit() # Commita aqui para que 'progress' tenha um ID

    # 1. Calcula o nível do aluno baseado no XP total
    total_xp = progress.total_xp_earned if progress.total_xp_earned is not None else 0
    level_info = calculate_level(total_xp) # Retorna um dicionário
    
    stats = { "scoreAchieved": progress.points_earned or 0, "totalPossibleScore": 100, "totalQuestions": 0, "averageTime": 0, "achievements": 0 }
    
    multiplayer_data = {"teammates": {}, "rivals": {}}
    team_name = None # Variável para armazenar o nome da casa
    
    # Busca posições
    multiplayer_data = _get_multiplayer_positions(user.id, activity)
    
    if activity.is_team_activity:            
        # Busca o Nome do Time
        enrollment = Enrollment.query.filter_by(student_id=user.id, class_id=activity.class_id).first()
        if enrollment and enrollment.team_id:
            team = Team.query.get(enrollment.team_id)
            if team:
                team_name = team.name

    # 2. Calcula as estatísticas (stats) dinamicamente
    total_possible_points = 0
    total_questions = 0
    if activity.game_elements and isinstance(activity.game_elements.get('questions'), list):
        questions = activity.game_elements['questions']
        total_questions = len(questions)
        total_possible_points = sum(int(q.get('points', 0)) for q in questions)

    # Cria o objeto 'stats' manualmente
    stats = {
        "scoreAchieved": progress.points_earned or 0,
        "totalPossibleScore": total_possible_points,
        "totalQuestions": total_questions,
        "averageTime": 35,  # Mockado
        "achievements": 3     # Mockado
    }

    # 3. Retorna um DICIONÁRIO (não um jsonify)
    return {
        "level": level_info["level"],
        "xp": level_info["xpEarnedForCurrentLevel"],
        "xpForNextLevel": level_info["xpForNextLevel"],
        "points_earned": progress.points_earned or 0,
        "coins": progress.coins or 0,
        "status": progress.status,
        "completed_steps": progress.completed_steps or [],
        "attempts": progress.attempts or 0,
        "stats": stats,
        "unlocked_activity_avatars": progress.unlocked_activity_avatars or [],
        "equipped_activity_avatar_url": progress.equipped_activity_avatar_url,
        "teammates_positions": multiplayer_data["teammates"], # Envia só a parte de colegas
        "rivals_positions": multiplayer_data["rivals"],       # Envia só a parte de rivais
        "team_name": team_name
    }
    
@progress_bp.route('/<int:activity_id>', methods=['GET'])
@jwt_required()
@cross_origin()
def get_activity_progress(activity_id):
    user_id = get_jwt_identity()
    
    try:
        # 1. Chama a função auxiliar que retorna um DICIONÁRIO
        progress_data_dict = _get_progress_json(user_id, activity_id)
        
        # 2. Transforma o DICIONÁRIO em JSON
        return jsonify(progress_data_dict), 200
        
    except Exception as e:
        # 3. Pega qualquer exceção (Ex: "Prazo encerrado") e transforma em JSON
        db.session.rollback()
        # Aqui o str(e) funciona porque 'e' é um objeto Exception
        return jsonify({"message": f"Erro ao buscar progresso: {str(e)}"}), 500

@progress_bp.route('/<int:activity_id>/leaderboard', methods=['GET'])
@jwt_required()
@cross_origin()
def get_leaderboard(activity_id):
    """Busca o ranking e enriquece com o título equipado e outros efeitos cosméticos."""
    current_app.logger.info(f"[DEBUG_POINTS] Gerando leaderboard para a atividade {activity_id}.")
    leaderboard_data = db.session.query(
        User,
        ActivityProgress,
        Title.display_text
    ).join(
        ActivityProgress, User.id == ActivityProgress.student_id
    ).outerjoin(
        Title, ActivityProgress.equipped_title_id == Title.id
    ).filter(
        ActivityProgress.activity_id == activity_id
    ).order_by(
        ActivityProgress.total_xp_earned.desc()
    ).limit(10).all()
    # Loga os dados brutos ANTES de qualquer processamento.
    raw_data_log = [
        {"user_id": p_obj.student_id, "total_xp_earned": p_obj.total_xp_earned} 
        for u_obj, p_obj, t_text in leaderboard_data
    ]
    current_app.logger.info(f"[DEBUG_POINTS] Dados brutos do BD para o leaderboard: {raw_data_log}")
    leaderboard = []
    for index, (user_obj, progress_obj, title_text) in enumerate(leaderboard_data):
        
        
        # Query completa para buscar os efeitos cosméticos ativos (exceto títulos)
        active_purchases = db.session.query(StoreItem.effect_id).join(
            Purchase, Purchase.item_id == StoreItem.id
        ).filter(
            Purchase.user_id == user_obj.id,
            Purchase.activity_id == activity_id,
            StoreItem.item_type == 'cosmetic',
            # A linha abaixo foi removida na última versão, mas é bom garantir que não está mais aí
            # StoreItem.item_type != 'title', 
            Purchase.is_consumed == False,
            ((Purchase.expires_at == None) | (Purchase.expires_at > datetime.utcnow()))
        ).order_by(Purchase.purchase_date.desc()).all()
        
        
        raw_effects = [effect[0] for effect in active_purchases if effect[0]]
        
        active_effects = []
        for effect in raw_effects:
            if isinstance(effect, str):
                try:
                    active_effects.append(json.loads(effect))
                except json.JSONDecodeError:
                    active_effects.append(effect)
            else:
                active_effects.append(effect)
        
        display_avatar = progress_obj.equipped_activity_avatar_url or \
                         user_obj.profile_picture or \
                         '/avatars/default_avatar.webp'
                         
        leaderboard.append({
            "id": user_obj.id,
            "rank": index + 1,
            "name": user_obj.name,
            "avatar": display_avatar,
            "points": progress_obj.total_xp_earned,
            "active_effects": active_effects,
            "title": progress_obj.equipped_title.display_text if progress_obj.equipped_title else None,
            "name_cosmetic": progress_obj.equipped_name_cosmetic.effect_id if progress_obj.equipped_name_cosmetic else None,
            "title_cosmetic": progress_obj.equipped_title_cosmetic.effect_id if progress_obj.equipped_title_cosmetic else None,
        })
    current_app.logger.info(f"[DEBUG_POINTS] Dados finais do leaderboard enviados para o frontend: {leaderboard}")
    return jsonify(leaderboard), 200


@progress_bp.route('/<int:activity_id>/analytics', methods=['GET'])
@jwt_required()
@cross_origin()
def get_analytics(activity_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'professor':
        return jsonify({"message": "Acesso negado."}), 403
    
    activity = Activity.query.get(activity_id)
    if not activity or activity.professor_id != user.id:
        return jsonify({"message": "Você não tem permissão para ver a análise desta atividade."}), 403

    progress_data = db.session.query(
        User,
        ActivityProgress
    ).join(
        ActivityProgress, User.id == ActivityProgress.student_id
    ).filter(
        ActivityProgress.activity_id == activity_id
    ).all()
    
    students_analytics = []
    total_score_sum = 0

    for student_user, progress in progress_data:
        correct_answers = StudentResponse.query.filter_by(student_id=student_user.id, activity_id=activity_id, is_correct=True).count()
        wrong_answers = StudentResponse.query.filter_by(student_id=student_user.id, activity_id=activity_id, is_correct=False).count()
        total_answers = correct_answers + wrong_answers
        accuracy = (correct_answers / total_answers * 100) if total_answers > 0 else 0
        chat_messages = 0
        level_info = calculate_level(progress.points_earned)

        # --- CORREÇÃO APLICADA AQUI ---
        # Trocamos a busca de 'event_type' e 'event_data' para usar 'action' e 'activity_id'
        narrative_views = EventLog.query.filter(
            EventLog.user_id == student_user.id,
            EventLog.action == 'narrative_viewed', # Usando a coluna correta
            EventLog.activity_id == activity_id    # Usando a coluna correta
        ).count()
        # ---------------------------------
        
        total_score_sum += progress.points_earned or 0

        students_analytics.append({
            "id": student_user.id,
            "name": student_user.name,
            "status": progress.status,
            "points": progress.points_earned,
            "level": level_info['level'],
            "accuracy": accuracy,
            "chat_messages": chat_messages,
            "total_answers": total_answers,
            "correct_answers": correct_answers,
            "wrong_answers": wrong_answers,
            "narrative_views": narrative_views
        })

    total_students = len(progress_data)
    completed_students = sum(1 for _, progress in progress_data if progress.status == 'completed')
    
    analytics = {
        "completionRate": (completed_students / total_students * 100) if total_students > 0 else 0,
        "averageScore": (total_score_sum / total_students) if total_students > 0 else 0,
        "students": students_analytics
    }
    
    return jsonify(analytics), 200

@progress_bp.route('/<int:activity_id>/purchase', methods=['POST'])
@jwt_required()
@cross_origin()
def purchase_store_item(activity_id):
    """Processa a compra de um item da loja por um aluno."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'aluno':
        return jsonify({"message": "Apenas alunos podem comprar itens."}), 403

    data = request.get_json()
    item_id = data.get('item_id')
    if not item_id:
        return jsonify({"message": "O ID do item é obrigatório."}), 400

    item = StoreItem.query.get(item_id)
    progress = ActivityProgress.query.filter_by(student_id=user_id, activity_id=activity_id).first()

    if not item or not progress:
        return jsonify({"message": "Item ou progresso não encontrado."}), 404
    
    current_coins = progress.coins if progress.coins is not None else 0

    if current_coins < item.price:
        return jsonify({"message": "Moedas insuficientes."}), 400

    try:
        progress.coins = current_coins - item.price
        
        new_purchase = Purchase(
            user_id=user_id, activity_id=activity_id, item_id=item.id,
            item_name=item.name, price_paid=item.price
        )
        db.session.add(new_purchase) # Adiciona a compra

        if item.item_type == 'avatar':
            avatar_to_unlock = item.effect_id
            if isinstance(avatar_to_unlock, str):
                avatar_to_unlock = json.loads(avatar_to_unlock)
            
            if progress.unlocked_activity_avatars is None:
                progress.unlocked_activity_avatars = []
            
            if not any(avatar['url'] == avatar_to_unlock['url'] for avatar in progress.unlocked_activity_avatars):
                progress.unlocked_activity_avatars.append(avatar_to_unlock)
                flag_modified(progress, "unlocked_activity_avatars")

        elif item.item_type == 'title':
            clean_effect_id = item.effect_id.strip('"') if isinstance(item.effect_id, str) else item.effect_id
            title_to_unlock = Title.query.filter_by(effect_id=clean_effect_id).first()
           
            if title_to_unlock:
                existing_unlock = UserUnlockedTitle.query.filter_by(
                    user_id=user.id, activity_id=activity_id, title_id=title_to_unlock.id).first()

                if not existing_unlock:
                    new_unlock = UserUnlockedTitle(user_id=user.id, activity_id=activity_id, title_id=title_to_unlock.id)
                    db.session.add(new_unlock)
                
                progress.equipped_title_id = title_to_unlock.id

        db.session.commit()
        
        # --- MUDANÇA PRINCIPAL AQUI ---
        # Busque o progresso atualizado para obter todas as informações consistentes
        updated_progress = ActivityProgress.query.filter_by(student_id=user_id, activity_id=activity_id).first()
        
        return jsonify({
            "message": "Compra realizada com sucesso!",
            # Retorna o objeto de progresso completo
            "updated_progress": updated_progress.to_dict() 
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro na compra do item {item_id} para o usuário {user_id}: {str(e)}")
        return jsonify({"message": "Erro interno ao processar a compra."}), 500

# 1. ROTA PARA BUSCAR ITENS
@progress_bp.route('/<int:activity_id>/store-items', methods=['GET'])
@jwt_required()
@cross_origin()
def get_store_items(activity_id):
    """Busca os itens da loja para uma atividade específica."""
    items = StoreItem.query.filter_by(activity_id=activity_id).all()
    return jsonify([item.to_dict() for item in items]), 200

# ROTA PARA PROFESSOR ADICIONAR UM ITEM
@progress_bp.route('/<int:activity_id>/store-items', methods=['POST'])
@jwt_required()
@cross_origin()
def add_store_item(activity_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'professor':
        return jsonify({"message": "Acesso negado."}), 403

    activity = Activity.query.get(activity_id)
    if not activity or activity.professor_id != user.id:
        return jsonify({"message": "Atividade não encontrada ou você não tem permissão."}), 404

    data = request.get_json()
    item_type = data.get('item_type', 'utility')
    
    # Esta variável irá armazenar o effect_id final e correto
    final_effect_id = data.get('effect_id')

    if item_type == 'title':
        title_display_text = data.get('name')
        if not title_display_text:
            return jsonify({"message": "O nome do título não pode ser vazio."}), 400

        safe_name = ''.join(e for e in title_display_text if e.isalnum()).upper()
        effect_id = f"TITLE_CUSTOM_{safe_name}"

        existing_title = Title.query.filter_by(display_text=title_display_text).first()

        if not existing_title:
            new_title = Title(
                effect_id=effect_id,
                display_text=title_display_text,
                description=data.get('description', 'Título personalizado.')
            )
            db.session.add(new_title)
        else:
            effect_id = existing_title.effect_id
        
        # A CORREÇÃO: Garante que o effect_id do StoreItem seja a string limpa que geramos.
        final_effect_id = effect_id

    new_item = StoreItem(
        activity_id=activity_id,
        name=data.get('name'),
        description=data.get('description'),
        price=int(data.get('price', 50)),
        icon=data.get('icon', '👑'),
        item_type=item_type,
        effect_id=final_effect_id # Usa a variável final que contém o effect_id correto
    )
    db.session.add(new_item)
    db.session.commit()
    
    return jsonify(new_item.to_dict()), 201

# ROTA PARA PROFESSOR DELETAR UM ITEM
@progress_bp.route('/store-items/<int:item_id>', methods=['DELETE'])
@jwt_required()
@cross_origin()
def delete_store_item(item_id):
    """Deleta um item da loja."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    item = StoreItem.query.get(item_id)
    if not item:
        return jsonify({"message": "Item não encontrado."}), 404
        
    activity = Activity.query.get(item.activity_id)
    if not user or user.role != 'professor' or activity.professor_id != user.id:
        return jsonify({"message": "Acesso negado."}), 403

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item deletado com sucesso."}), 200

@progress_bp.route('/<int:activity_id>/update', methods=['POST'])
@jwt_required()
@cross_origin()
def update_activity_progress(activity_id):
    """
    Recebe os pontos ganhos por um aluno em uma atividade e atualiza o progresso.
    ATUALIZAÇÃO: Esta rota agora só deve ser usada para moedas ou outros valores
    que NÃO sejam os pontos principais do quiz (XP), que são tratados por /submit_answer.
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'aluno':
        return jsonify({"message": "Apenas alunos podem atualizar o progresso."}), 403

    data = request.get_json()
    current_app.logger.info(f"[PROGRESS_UPDATE] Dados recebidos para a atividade {activity_id}: {data}")
    # A rota ainda pode receber 'points' do frontend, mas vamos ignorá-los deliberadamente.
    coins_to_add = data.get('coins', 0)

    if coins_to_add is None:
        return jsonify({"message": "Nenhuma moeda fornecida."}), 400

    try:
        coins_to_add = int(coins_to_add)
    except (ValueError, TypeError):
        return jsonify({"message": "Valor de moedas inválido."}), 400
    
    activity = Activity.query.get(activity_id)
    if not activity or not activity.class_id:
        return jsonify({"message": "Atividade ou turma associada não encontrada."}), 404

    try:
        progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()

        if not progress:
            progress = ActivityProgress(
                student_id=user.id,
                activity_id=activity_id,
                class_id=activity.class_id,
                points_earned=0, # Inicia com 0
                coins_earned=coins_to_add,
                coins=coins_to_add,
                attempts=1,
                status='in_progress'
            )
            db.session.add(progress)
        else:
            # REMOVEMOS A SOMA DE 'points_earned' e 'total_xp_earned' DESTA ROTA
            progress.coins = (progress.coins or 0) + coins_to_add
        
        db.session.commit()
        
        return jsonify({
            "message": "Progresso atualizado com sucesso.",
            "new_total_points": progress.points_earned, # Retorna o total de pontos existente
            "new_total_coins": progress.coins
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao atualizar progresso para user {current_user_id} na atividade {activity_id}: {str(e)}")
        return jsonify({"message": "Erro interno ao salvar o progresso."}), 500

# --- ROTA DA ROLETA (VERSÃO CORRIGIDA) ---
@progress_bp.route('/<int:activity_id>/spin', methods=['POST'])
@jwt_required()
def spin_roulette_for_activity(activity_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    data = request.get_json() or {}
    is_retry = data.get('is_retry', False)

    if user.role != 'aluno':
        return jsonify({"message": "Apenas alunos podem girar a roleta."}), 403

    progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()
    if not progress:
        activity = Activity.query.get(activity_id)
        if not activity: return jsonify({"message": "Atividade não encontrada."}), 404
        progress = ActivityProgress(student_id=user.id, activity_id=activity_id, class_id=activity.class_id)
        db.session.add(progress)

    # --- [MODO TESTE] COOLDOWN DESATIVADO ---
    # Para voltar ao normal, descomente as linhas abaixo:
    if not is_retry and progress.last_spin_date:
        last_spin = progress.last_spin_date.date()
        today = datetime.utcnow().date()
        if last_spin == today:
            return jsonify({"message": "Você já girou a roleta hoje! Volte amanhã."}), 400

    # --- LISTA DE PRÊMIOS (XP -> MOEDAS) ---
    prizes = [
        {"type": "coins", "value": 50, "label": "50 Moedas"},
        {"type": "coins", "value": 100, "label": "100 Moedas"},
        {"type": "coins", "value": 150, "label": "150 Moedas"},
        {"type": "title", "value": "TITLE_LUCKY", "label": "Título: O Sortudo"},
        {"type": "avatar", "value": {"url": "/avatars/avatar_special.webp", "name": "Sortudo", "promotable": True}, "label": "Avatar Raro!"},
    ]

    # --- [HACK DE PROBABILIDADE] ---
    # Pesos correspondentes à lista acima. Aumente o do Título (índice 3) para testar.
    # Ex: [10, 10, 10, 50, 10] -> Título tem 5x mais chance que o resto.
    prize_weights = [20, 20, 20, 10, 10] 

    # Loop para garantir que não caia avatar repetido (mantendo os pesos)
    prize = None
    attempts = 0
    
    unlocked_avatar_urls = [av['url'] for av in (progress.unlocked_activity_avatars or []) if isinstance(av, dict)]

    while attempts < 20:
        # random.choices retorna uma lista, pegamos o primeiro [0]
        selected_prize = random.choices(prizes, weights=prize_weights, k=1)[0]
        
        # Se for avatar e já tiver, tenta de novo
        if selected_prize['type'] == 'avatar':
            if selected_prize['value']['url'] in unlocked_avatar_urls:
                # Opcional: Se quiser permitir retry para avatar repetido, pare aqui e deixe a lógica de duplicidade abaixo tratar
                prize = selected_prize
                break
            else:
                prize = selected_prize
                break
        else:
            prize = selected_prize
            break
        attempts += 1
    
    # Fallback se o loop falhar
    if not prize: prize = prizes[0]

    # --- LÓGICA DE DUPLICIDADE (RETRY) ---
    is_duplicate = False
    
    if prize['type'] == 'avatar':
        if prize['value']['url'] in unlocked_avatar_urls:
            is_duplicate = True

    elif prize['type'] == 'title':
        effect_id = prize['value']
        title_obj = Title.query.filter_by(effect_id=effect_id).first()
        if not title_obj:
            # Cria o título se não existir
            title_obj = Title(effect_id=effect_id, display_text="O Sortudo", description="Concedido pela Roda da Fortuna.")
            db.session.add(title_obj)
            db.session.flush()
            
        existing_unlock = UserUnlockedTitle.query.filter_by(user_id=user.id, activity_id=activity_id, title_id=title_obj.id).first()
        if existing_unlock:
            is_duplicate = True

    if is_duplicate:
        return jsonify({
            "message": "Item repetido! Gire novamente.",
            "prize": {
                "label": prize['label'],
                "type": prize['type'],
                "is_duplicate": True
            }
        }), 200

    # --- CONSOLIDAÇÃO DO PRÊMIO ---
    if prize['type'] == 'coins':
        # [MUDANÇA] Agora soma Moedas, não XP
        progress.coins = (progress.coins or 0) + prize['value']
        # Se quiser somar pontos ganhos também (para ranking), descomente:
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
        progress.equipped_title_id = title_obj.id # Equipa automático para feedback visual

    # Salva data (Em teste, isso não vai bloquear devido ao comentário lá em cima)
    progress.last_spin_date = datetime.utcnow()
    
    new_win = RouletteWin(user_id=user.id, activity_id=activity_id, prize_label=prize['label'])
    db.session.add(new_win)
    db.session.commit()

    updated_progress_data = _get_progress_json(user_id, activity_id)
    return jsonify({
        "message": f"Você ganhou {prize['label']}!", 
        "prize": {"label": prize['label'], "type": prize['type'], "is_duplicate": False},
        "updated_progress": updated_progress_data
    }), 200


# --- NOVA ROTA PARA BUSCAR OS VENCEDORES ---
@progress_bp.route('/<int:activity_id>/roulette-winners', methods=['GET'])
@jwt_required()
@cross_origin()
def get_roulette_winners(activity_id):
    """Retorna os últimos 5 vencedores da roleta para uma atividade específica."""
    
    winners = db.session.query(
        User.name,
        RouletteWin.prize_label
    ).join(
        User, User.id == RouletteWin.user_id
    ).filter(
        RouletteWin.activity_id == activity_id
    ).order_by(
        RouletteWin.timestamp.desc()
    ).limit(5).all()

    # Formata os dados para o frontend
    winners_data = [
        {
            "userName": row.name,
            "prize": row.prize_label
        }
        for row in winners
    ]
    
    return jsonify(winners_data), 200



# Configuração dos Símbolos (Emojis) e Pesos
# Quanto menor o peso, mais raro. O multiplicador é aplicado na aposta.
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

@progress_bp.route('/<int:activity_id>/play-slot', methods=['POST'])
@jwt_required()
def play_slot_machine(activity_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # 1. Validar Custo da Aposta
    BET_COST = 10
    current_coins = getattr(user, 'coins', 0) # Ou buscar na tabela de progresso se for por atividade
    
    # Se as moedas ficarem no ActivityProgress, ajuste aqui:
    progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()
    if not progress: return jsonify({"message": "Progresso não encontrado"}), 404
    
    current_coins = progress.coins or 0
    
    if current_coins < BET_COST:
        return jsonify({"message": f"Saldo insuficiente. Custo: {BET_COST} moedas."}), 400

    # 2. Debitar Aposta
    progress.coins = current_coins - BET_COST
    
    # 3. Gerar Matriz 3x3 (O coração do jogo)
    # Escolhemos 9 símbolos baseados em seus pesos (probabilidade)
    keys = list(SLOT_SYMBOLS.keys())
    weights = [SLOT_SYMBOLS[k]['weight'] for k in keys]
    
    matrix = []
    for _ in range(3): # 3 Linhas
        row = random.choices(keys, weights=weights, k=3)
        matrix.append(row)

    # 4. Verificar Vitórias (Linhas de Pagamento)
    total_win = 0
    winning_lines = [] # Para mostrar no frontend onde ganhou
    
    for line_index, coords in enumerate(PAYLINES):
        # Pega os símbolos dessa linha
        s1 = matrix[coords[0][0]][coords[0][1]]
        s2 = matrix[coords[1][0]][coords[1][1]]
        s3 = matrix[coords[2][0]][coords[2][1]]
        
        # Lógica de Vitória: 3 Iguais OU (2 Iguais + 1 Wild)
        # Simplificação: Vamos exigir 3 iguais (ou Wild conta como coringa)
        if s1 == s2 == s3 or (s1 == s2 and s3 == 'wild') or (s1 == 'wild' and s2 == s3):
            # Determina qual é o símbolo vencedor (não pode ser a bomba se ganhar)
            winner_symbol = s1 if s1 != 'wild' else s2
            if winner_symbol == 'bomb': continue # Bomba nunca paga

            win_amount = BET_COST * SLOT_SYMBOLS[winner_symbol]['multiplier']
            total_win += win_amount
            winning_lines.append({
                "line_index": line_index, 
                "symbol": winner_symbol,
                "amount": win_amount
            })

    # 5. Creditar Vitória (Se houver)
    if total_win > 0:
        # Soma nas MOEDAS
        progress.coins += total_win
        
        # --- CORREÇÃO: Soma no XP (para o Ranking) e Pontos ---
        progress.total_xp_earned = (progress.total_xp_earned or 0) + total_win
        progress.points_earned = (progress.points_earned or 0) + total_win
        # Registra vencedor histórico APENAS para grandes vitórias
        if total_win >= 50: 
            # CORREÇÃO AQUI:
            # 1. Usamos SlotWin em vez de RouletteWin
            # 2. O campo correto é 'prize_description' (baseado na sua rota get_slot_winners)
            new_win = SlotWin(
                user_id=user.id, 
                activity_id=activity_id, 
                prize_description=f"{total_win} Moedas"
            )
            db.session.add(new_win)

    db.session.commit()
    
    # 6. Retorno Rico para o Frontend
    return jsonify({
        "matrix": matrix, # [['orange', 'bell', 'orange'], [...]]
        "total_win": total_win,
        "winning_lines": winning_lines,
        "updated_progress": _get_progress_json(user_id, activity_id), # Sua função auxiliar existente
        "is_jackpot": total_win >= (BET_COST * 20)
    })

@progress_bp.route('/<int:activity_id>/slot-winners', methods=['GET'])
@jwt_required()
@cross_origin()
def get_slot_winners(activity_id):
    """Retorna os últimos 5 vencedores do caça-níquel para uma atividade."""
    
    limit_amount = 5 

    winners_query = db.session.query(
        User.name,
        SlotWin.prize_description
    ).join(
        User, User.id == SlotWin.user_id
    ).filter(
        SlotWin.activity_id == activity_id
    ).order_by(
        SlotWin.timestamp.desc()
    ).limit(limit_amount)
    
    winners = winners_query.all()

    # ===> LOG DE DIAGNÓSTICO <===
    # Este log aparecerá no seu terminal do backend
    #current_app.logger.info(f"Buscando ganhadores para activity_id {activity_id}. Encontrados {len(winners)} de um limite de {limit_amount}.")
    # ============================

    winners_data = [
        {
            "userName": row.name,
            "prize": row.prize_description
        }
        for row in winners
    ]
    
    return jsonify(winners_data), 200



@progress_bp.route('/<int:activity_id>/complete-step', methods=['POST'])
@jwt_required()
@cross_origin()
def complete_activity_step(activity_id):
    """
    Registra que um aluno completou um passo específico de uma atividade.
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user or user.role != 'aluno':
        return jsonify({"message": "Apenas alunos podem completar passos."}), 403

    data = request.get_json()
    step_id_to_complete = data.get('step_id')

    if not step_id_to_complete:
        return jsonify({"message": "O ID do passo ('step_id') é obrigatório."}), 400

    try:
        progress = ActivityProgress.query.filter_by(
            student_id=user.id,
            activity_id=activity_id
        ).first()

        # --- INÍCIO DA CORREÇÃO ---
        # Se o progresso não existir, cria um novo registro para o aluno.
        if not progress:
            activity = Activity.query.get(activity_id)
            if not activity or not activity.class_id:
                return jsonify({"message": "Atividade ou turma associada não encontrada."}), 404
            
            progress = ActivityProgress(
                student_id=user.id,
                activity_id=activity_id,
                class_id=activity.class_id,
                status='in_progress'
            )
            db.session.add(progress)
        # --- FIM DA CORREÇÃO ---

        # Garante que completed_steps seja uma lista
        if progress.completed_steps is None:
            progress.completed_steps = []
        
        # Adiciona o novo step_id à lista, evitando duplicatas
        if step_id_to_complete not in progress.completed_steps:
            # Modifica a lista diretamente
            progress.completed_steps.append(step_id_to_complete)
            # Notifica explicitamente o SQLAlchemy que o campo JSON foi alterado
            flag_modified(progress, "completed_steps")
        
        db.session.commit()
        
        return jsonify({
            "message": "Passo concluído com sucesso!",
            "completed_steps": progress.completed_steps
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao completar passo {step_id_to_complete} para user {current_user_id}: {str(e)}")
        return jsonify({"message": "Erro interno ao salvar a conclusão do passo."}), 500
    
# --- ROTA NOVA E DEDICADA PARA A CONCLUSÃO DA ATIVIDADE ---
@progress_bp.route('/<int:activity_id>/collect-final-reward', methods=['POST'])
@jwt_required()
def collect_final_reward(activity_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'aluno':
        return jsonify({"message": "Acesso negado."}), 403

    activity = Activity.query.get(activity_id)
    progress = ActivityProgress.query.filter_by(student_id=user.id, activity_id=activity_id).first()
    if progress and progress.status == 'completed':
        return jsonify({"message": "Esta recompensa final já foi coletada."}), 400 # 400 Bad Request

    if not activity or not progress:
        return jsonify({"message": "Atividade ou progresso não encontrado."}), 404

    # 1. VALIDAÇÃO: Garante que o aluno completou todos os passos
    progression_path = activity.gamification_design.get('progression_path', [])
    completed_steps = set(progress.completed_steps or [])
    
    required_step_ids = {step['id'] for step in progression_path}

    if not required_step_ids.issubset(completed_steps):
        return jsonify({"message": "Você ainda não completou todos os passos da trilha para coletar a recompensa final."}), 403

    # 2. CONCESSÃO DA RECOMPENSA
    final_reward_config = activity.gamification_design.get('finalReward')
    if final_reward_config:
        reward_type = final_reward_config.get('rewardType')
        value = final_reward_config.get('value')

        if reward_type == 'xp':
            progress.total_xp_earned = (progress.total_xp_earned or 0) + int(value)
        
        elif reward_type == 'title':
            title_to_unlock = Title.query.filter_by(effect_id=value).first()
            if title_to_unlock:
                existing_unlock = UserUnlockedTitle.query.filter_by(user_id=user.id, activity_id=activity_id, title_id=title_to_unlock.id).first()
                if not existing_unlock:
                    new_unlock = UserUnlockedTitle(user_id=user.id, activity_id=activity_id, title_id=title_to_unlock.id)
                    db.session.add(new_unlock)
                # Equipa o título final
                progress.equipped_title_id = title_to_unlock.id
    
    GLOBAL_XP_AWARD = 100 
    user.global_xp = (user.global_xp or 0) + GLOBAL_XP_AWARD
    # 3. ATUALIZAÇÃO DE STATUS
    progress.status = 'completed'
    progress.completed_at = datetime.utcnow()

    # 4. REGISTRO DO EVENTO (se você tiver o modelo EventLog)
    completion_event = EventLog(
        user_id=user.id,
        activity_id=activity_id,
        section='activity',
        action='activity_completed',
        details={'final_reward_collected': final_reward_config}
    )
    db.session.add(completion_event)

    try:
        check_and_award_medals(user_id=user_id, activity_id=activity_id, event_type='activity_completed')
    except Exception as e:
        # Usamos um log de erro para não quebrar a funcionalidade principal se o sistema de medalhas falhar
        current_app.logger.error(f"Erro ao verificar medalhas para user {user_id} na atividade {activity_id}: {str(e)}")
    

    db.session.commit()

    updated_progress_data = _get_progress_json(user_id, activity_id)
    return jsonify({
        "message": "Atividade concluída e recompensa coletada com sucesso!",
        "updated_progress": updated_progress_data, # Retorna o JSON completo (Micro)
        "global_xp": user.global_xp # Retorna o XP Global (Macro)
    }), 200

@progress_bp.route('/<int:activity_id>/avatar', methods=['PUT'])
@jwt_required()
def equip_activity_avatar(activity_id):
    """Equipa um avatar específico para uma atividade."""
    user_id = get_jwt_identity()
    data = request.get_json()
    avatar_url_to_equip = data.get('avatar_url')

    if not avatar_url_to_equip:
        return jsonify({"message": "A URL do avatar é obrigatória."}), 400

    progress = ActivityProgress.query.filter_by(student_id=user_id, activity_id=activity_id).first()

    if not progress:
        return jsonify({"message": "Progresso na atividade não encontrado."}), 404

    # Verifica se o avatar está na lista de desbloqueados
    unlocked_urls = [avatar['url'] for avatar in (progress.unlocked_activity_avatars or [])]
    if avatar_url_to_equip not in unlocked_urls:
        return jsonify({"message": "Você não desbloqueou este avatar ainda."}), 403

    progress.equipped_activity_avatar_url = avatar_url_to_equip
    db.session.commit()

    return jsonify({
        "message": "Avatar equipado com sucesso!",
        "equipped_avatar": progress.equipped_activity_avatar_url
    }), 200


# Esta rota poderia ficar em um `users.py`, mas por simplicidade vamos mantê-la aqui.
@progress_bp.route('/user/avatars/promote', methods=['POST'])
@jwt_required()
def promote_avatar_to_global():
    """Promove um avatar de atividade para a lista de avatares globais do usuário."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    avatar_to_promote = data.get('avatar') # Espera um objeto {'url': '...', 'name': '...'}

    if not avatar_to_promote or 'url' not in avatar_to_promote or 'name' not in avatar_to_promote:
        return jsonify({"message": "Objeto de avatar inválido."}), 400

    if user.unlocked_global_avatars is None:
        user.unlocked_global_avatars = []
    
    # Evita duplicatas
    if any(avatar['url'] == avatar_to_promote['url'] for avatar in user.unlocked_global_avatars):
        return jsonify({"message": "Este avatar já está na sua lista global."}), 200

    user.unlocked_global_avatars.append(avatar_to_promote)
    flag_modified(user, "unlocked_global_avatars")
    db.session.commit()
    
    return jsonify({
        "message": "Avatar promovido com sucesso para seu perfil!",
        "unlocked_global_avatars": user.unlocked_global_avatars
    }), 200
  
@progress_bp.route('/<int:activity_id>/unlocked-cosmetics', methods=['GET'])
@jwt_required()
def get_unlocked_cosmetics(activity_id):
    """Retorna todos os itens cosméticos que um usuário comprou em uma atividade."""
    user_id = get_jwt_identity()
    
    # Busca todas as compras do usuário na atividade que são do tipo 'cosmetic'
    purchased_cosmetics = db.session.query(StoreItem).join(Purchase).filter(
        Purchase.user_id == user_id,
        Purchase.activity_id == activity_id,
        StoreItem.item_type == 'cosmetic'
    ).all()
    
    # Converte os itens para um formato de dicionário seguro para JSON
    cosmetics_data = [item.to_dict() for item in purchased_cosmetics]
    
    return jsonify(cosmetics_data), 200
    
@progress_bp.route('/<int:activity_id>/unlocked-titles', methods=['GET'])
@jwt_required()
def get_unlocked_titles(activity_id):
    """Retorna todos os títulos que um usuário desbloqueou em uma atividade."""
    user_id = get_jwt_identity()
    unlocked_entries = UserUnlockedTitle.query.options(joinedload(UserUnlockedTitle.title)).filter_by(user_id=user_id, activity_id=activity_id).all()
    
    titles = [{
        "id": entry.title.id,
        "displayText": entry.title.display_text,
        "description": entry.title.description
    } for entry in unlocked_entries]
    
    return jsonify(titles), 200

@progress_bp.route('/<int:activity_id>/equip-title', methods=['PUT'])
@jwt_required()
def equip_title(activity_id):
    """Equipa um título que o usuário já desbloqueou."""
    user_id = get_jwt_identity()
    data = request.get_json()
    title_id_to_equip = data.get('title_id') # Espera o ID do título ou None para desequipar

    progress = ActivityProgress.query.filter_by(student_id=user_id, activity_id=activity_id).first()
    if not progress:
        return jsonify({"message": "Progresso não encontrado."}), 404

    # Se o ID for None, desequipa
    if title_id_to_equip is None:
        progress.equipped_title_id = None
        db.session.commit()
        return jsonify({"message": "Título desequipado."}), 200

    # Verifica se o usuário realmente desbloqueou este título
    is_unlocked = UserUnlockedTitle.query.filter_by(user_id=user_id, activity_id=activity_id, title_id=title_id_to_equip).first()
    if not is_unlocked:
        return jsonify({"message": "Você não possui este título."}), 403

    progress.equipped_title_id = title_id_to_equip
    db.session.commit()
    return jsonify({"message": "Título equipado com sucesso!"}), 200

@progress_bp.route('/<int:activity_id>/equip-cosmetic', methods=['PUT'])
@jwt_required()
def equip_cosmetic(activity_id):
    """Equipa um efeito cosmético em um 'slot' (nome ou título)."""
    user_id = get_jwt_identity()
    data = request.get_json()
    item_id = data.get('item_id') # ID do StoreItem ou None para desequipar
    slot = data.get('slot') # 'name' ou 'title'

    if slot not in ['name', 'title']:
        return jsonify({"message": "O 'slot' deve ser 'name' ou 'title'."}), 400

    progress = ActivityProgress.query.filter_by(student_id=user_id, activity_id=activity_id).first()
    if not progress:
        return jsonify({"message": "Progresso não encontrado."}), 404

    # Verifica se o usuário possui o item (se não estiver desequipando)
    if item_id is not None:
        purchase = Purchase.query.join(StoreItem).filter(
            Purchase.user_id == user_id,
            Purchase.activity_id == activity_id,
            Purchase.item_id == item_id,
            StoreItem.item_type == 'cosmetic'
        ).first()
        if not purchase:
            return jsonify({"message": "Você não possui este item cosmético."}), 403

    if slot == 'name':
        progress.equipped_name_cosmetic_id = item_id
    elif slot == 'title':
        progress.equipped_title_cosmetic_id = item_id
    
    db.session.commit()
    return jsonify({"message": f"Cosmético equipado no slot '{slot}' com sucesso!"}), 200

def _get_multiplayer_positions(user_id, activity):
    """
    Retorna posições no tabuleiro.
    - Se for EM EQUIPE: Retorna 'teammates' (meu time) e 'rivals' (outros times).
    - Se for SOLO: Retorna todos os alunos da turma em 'teammates' (como 'Colegas').
    """
    data = { "teammates": {}, "rivals": {} }
    
    # Mapeamento da trilha (ID -> Índice)
    progression_path = activity.gamification_design.get('progression_path', [])
    step_order = {step['id']: i for i, step in enumerate(progression_path)}
    step_order['start'] = -1
    ordered_step_ids = [step['id'] for step in progression_path]

    def get_current_step_id(progress_obj):
        if not progress_obj or not progress_obj.completed_steps:
            return 'start'
        last_completed = progress_obj.completed_steps[-1]
        if last_completed == ordered_step_ids[-1]:
             return 'final_reward' if progress_obj.status == 'completed' else last_completed
        current_index = step_order.get(last_completed, -1) + 1
        if current_index < len(ordered_step_ids):
            return ordered_step_ids[current_index]
        return last_completed

    # --- CENÁRIO 1: ATIVIDADE SOLO (MOSTRAR TODOS COMO COLEGAS) ---
    if not activity.is_team_activity:
        # Busca todos os alunos da turma (independente de time)
        results = (
            db.session.query(User, ActivityProgress)
            .join(Enrollment, User.id == Enrollment.student_id)
            .outerjoin(ActivityProgress, (ActivityProgress.student_id == User.id) & (ActivityProgress.activity_id == activity.id))
            .filter(Enrollment.class_id == activity.class_id)
            .filter(User.id != user_id) # Exclui eu mesmo
            .all()
        )
        
        for user_obj, prog in results:
            current_step = get_current_step_id(prog)
            
            if current_step not in data["teammates"]:
                data["teammates"][current_step] = []
            
            avatar = prog.equipped_activity_avatar_url if prog else None
            avatar = avatar or user_obj.profile_picture or '/avatars/default_avatar.webp'
            
            data["teammates"][current_step].append({
                "name": user_obj.name,
                "avatar": avatar
            })
            
        return data

    # --- CENÁRIO 2: ATIVIDADE EM EQUIPE (LÓGICA ORIGINAL) ---
    
    # 1. Descobre o time do usuário
    my_enrollment = Enrollment.query.filter_by(student_id=user_id, class_id=activity.class_id).first()
    if not my_enrollment or not my_enrollment.team_id:
        return data # Sem time, sem multiplayer

    my_team_id = my_enrollment.team_id
    
    results = (
        db.session.query(Enrollment, User, ActivityProgress, Team)
        .join(User, Enrollment.student_id == User.id)
        .join(Team, Enrollment.team_id == Team.id)
        .outerjoin(ActivityProgress, (ActivityProgress.student_id == User.id) & (ActivityProgress.activity_id == activity.id))
        .filter(Enrollment.class_id == activity.class_id)
        .all()
    )

    rival_max_indices = {}
    rival_teams_info = {}

    for enroll, user_obj, prog, team in results:
        current_step = get_current_step_id(prog)
        current_index = step_order.get(current_step, -1)
        if current_step == 'final_reward': current_index = 9999
        
        # A. MEU TIME (Detalhado)
        if team.id == my_team_id:
            if user_obj.id == user_id: continue 

            if current_step not in data["teammates"]:
                data["teammates"][current_step] = []
            
            avatar = prog.equipped_activity_avatar_url if prog else None
            avatar = avatar or user_obj.profile_picture or '/avatars/default_avatar.webp'
            
            data["teammates"][current_step].append({
                "name": user_obj.name,
                "avatar": avatar
            })

        # B. RIVAIS (Agrupado por Time)
        else:
            if team.id not in rival_max_indices:
                rival_max_indices[team.id] = -99
                rival_teams_info[team.id] = team
            
            if current_index > rival_max_indices[team.id]:
                rival_max_indices[team.id] = current_index

    # Processa Rivais
    for r_team_id, max_idx in rival_max_indices.items():
        if max_idx == -99: step_id = 'start'
        elif max_idx == 9999: step_id = 'final_reward'
        elif 0 <= max_idx < len(ordered_step_ids): step_id = ordered_step_ids[max_idx]
        else: step_id = 'start'

        if step_id not in data["rivals"]:
            data["rivals"][step_id] = []
        
        team_obj = rival_teams_info[r_team_id]
        data["rivals"][step_id].append({
            "name": team_obj.name,
            "avatar": team_obj.avatar_url or '/badges/default_shield.webp'
        })

    return data
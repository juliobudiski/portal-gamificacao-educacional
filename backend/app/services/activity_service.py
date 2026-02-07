from .. import db
from ..models import Activity, ActivityRevision, Tag, EventLog, ActivityProgress, Conversation, ChatMessage, ActivityRating 
from flask import jsonify
import logging
from flask_jwt_extended import jwt_required, current_user, get_jwt_identity
from ..models import StoreItem, Title, UserUnlockedTitle, UserUnlockedMedal, db, Activity, Tag, activity_tag, ActivityRevision, User, Class, Enrollment, Purchase, StoreItem, SlotWin, RouletteWin, StudentResponse, QuizContent, NarrativeContent, LearningContent
from sqlalchemy.orm import noload
from copy import deepcopy
from sqlalchemy import or_
import json
logger = logging.getLogger(__name__)
from ..utils.logging import _log_system_event
from datetime import datetime, timedelta

DEFAULT_COSMETICS = [
    {
        "name": "Nome Dourado (Neon)",
        "description": "Destaque seu nome no ranking com um brilho dourado.",
        "price": 750, "icon": "🌟", "item_type": "cosmetic",
        "effect_id": json.dumps({ "type": "color", "color": "#FBBF24", "effect": "neon" }) # Usamos json.dumps
    },
    {
        "name": "Nome Prateado (Neon)",
        "description": "Um visual elegante e prateado para o seu nome no ranking.",
        "price": 500, "icon": "✨", "item_type": "cosmetic",
        "effect_id": json.dumps({ "type": "color", "color": "#D1D5DB", "effect": "neon" })
    }
]

DEFAULT_AVATARS = [
    {
        "name": "Gato Mago",
        "description": "Um companheiro místico para suas aventuras.",
        "price": 300, "icon": "😺", "item_type": "avatar",
        "effect_id": json.dumps({ "url": "/avatars/wizard_cat.webp", "name": "Gato Mago", "promotable": True })
    },
    {
        "name": "Robô Futurista",
        "description": "Tecnologia de ponta para o aluno moderno.",
        "price": 300, "icon": "🤖", "item_type": "avatar",
        "effect_id": json.dumps({ "url": "/avatars/robot.webp", "name": "Robô Futurista", "promotable": False })
    }
]

DEFAULT_TITLES = [
    {
        "name": "O Grande Comprador",
        "description": "Um título para aqueles que investem em seu sucesso na loja.",
        "price": 1200, "icon": "👑", "item_type": "title",
        "effect_id": "TITLE_GRANDE_COMPRADOR" # effect_id simples para o Título
    }
]

def create_activity(user, data):
    logger.info(f"Usuário ID {user.id} tentando criar uma nova atividade (Batch Creation).")

    if user.role != 'professor':
        return {"message": "Acesso negado"}, 403
    
    activity_planning_data = data.get('activityPlanning', {})
    
    # --- CORREÇÃO: VERIFICA SE JÁ É UM RASCUNHO EXISTENTE ---
    existing_id = data.get('id')
    activity = None
    
    if existing_id:
        activity = Activity.query.get(existing_id)
        # Verifica se existe e se pertence ao professor
        if activity and activity.professor_id == user.id:
            logger.info(f"Atualizando rascunho existente ID {activity.id} para oficial.")
            
            # Limpa conteúdos antigos para recriar (Evita duplicação de Quiz/Narrativa)
            QuizContent.query.filter_by(activity_id=activity.id).delete()
            NarrativeContent.query.filter_by(activity_id=activity.id).delete()
            LearningContent.query.filter_by(activity_id=activity.id).delete()
            
            # Se a loja estava vazia (bug antigo), popula agora.
            if not activity.store_items:
                 _populate_default_store(activity.id)
    # --------------------------------------------------------

    try:
        # SE NÃO EXISTE (Novo) -> Instancia
        if not activity:
            activity = Activity(professor_id=user.id)
            db.session.add(activity)
            db.session.flush() # Gera o ID
            _populate_default_store(activity.id) # Popula loja apenas se for novo

        # ATUALIZA CAMPOS (Seja novo ou existente)
        activity.title = data.get('title')
        activity.description = data.get('description', '')
        activity.current_scenario = data.get('currentScenario', {})
        activity.desired_scenario = data.get('desiredScenario', {})
        activity.activity_planning = activity_planning_data
        activity.player_profile = data.get('playerProfile', {})
        activity.game_elements = data.get('gameElements', {})
        activity.rewards_offered = data.get('rewardsOffered', {})
        activity.rewarded_actions = data.get('rewardedActions', {})
        activity.gamification_rules = data.get('gamificationRules', {})
        activity.gamification_design = data.get('gamificationDesign', {})
        activity.area_knowledge = data.get('areaKnowledge')
        activity.is_public = data.get('isPublic', False)
        activity.is_team_activity = activity_planning_data.get('isTeamActivity', False)
        
        # O PULO DO GATO: Remove a marcação de rascunho
        activity.is_draft = False 

        # Tratamento de Tags
        if 'tags' in data:
            activity.tags = [] # Limpa tags anteriores
            for tag_name in data['tags']:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                activity.tags.append(tag)
        
        # 3. PROCESSAMENTO DE CONTEÚDO (Extração para Tabelas)
        gamification_design = data.get('gamificationDesign', {})
        progression_path = gamification_design.get('progression_path', [])

        if progression_path and isinstance(progression_path, list):
            for step in progression_path:
                content = step.get('content')
                step_id = step.get('id')

                if content and step_id:
                    content_type = content.get('type')

                    if content_type == 'quiz':
                        new_quiz = QuizContent(
                            activity_id=activity.id,
                            step_id=str(step_id),
                            questions=content.get('questions', [])
                        )
                        db.session.add(new_quiz)

                    elif content_type == 'narrative':
                        new_narrative = NarrativeContent(
                            activity_id=activity.id,
                            step_id=str(step_id),
                            scenario=content.get('scenario', ''),
                            characters=content.get('characters', []),
                            dialogue=content.get('dialogue', [])
                        )
                        db.session.add(new_narrative)
                    
                    elif content_type == 'content' or content_type == 'learning_material':
                         new_learning = LearningContent(
                            activity_id=activity.id,
                            step_id=str(step_id),
                            video_url=content.get('video_url'),
                            text_content=content.get('text_content'),
                            material_link=content.get('material_link')
                         )
                         db.session.add(new_learning)

        db.session.commit()
        
        _log_system_event(
            user_id=user.id,
            action='activity_created_official',
            activity_id=activity.id,
            details={'title': activity.title}
        )
        
        return {"message": "Atividade salva com sucesso!", "activity": activity.to_dict()}, 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao salvar atividade (Service): {str(e)}")
        return {"message": f"Erro ao salvar atividade: {str(e)}"}, 500

def update_activity_structure(user, activity_id, data):
    """Atualiza apenas o campo gamification_design de uma atividade."""
    activity = Activity.query.get(activity_id)

    if not activity:
        return {"message": "Atividade não encontrada"}, 404
    
    if activity.professor_id != user.id:
        return {"message": "Acesso negado."}, 403

    try:
        if 'gamificationDesign' in data:
            activity.gamification_design = data['gamificationDesign']
            db.session.commit()
            logger.info(f"Estrutura da atividade ID {activity_id} atualizada.")
            return {"message": "Estrutura salva com sucesso!"}, 200
        else:
            return {"message": "Nenhum dado de estrutura fornecido."}, 400
            
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao atualizar estrutura da atividade ID {activity_id}: {str(e)}")
        return {"message": "Erro interno ao salvar estrutura."}, 500

def update_activity(user, activity_id, data):
    print("--- PAYLOAD RECEBIDO NA ROTA DE UPDATE ---", flush=True)
    # print(json.dumps(data, indent=2), flush=True)
    print("--- FIM DO PAYLOAD ---", flush=True)

    """Atualiza uma atividade existente."""
    activity = Activity.query.get(activity_id)

    if not activity:
        return {"message": "Atividade não encontrada"}, 404
    
    if activity.professor_id != user.id:
        return {"message": "Acesso negado. Você não é o dono desta atividade."}, 403

    try:
        # Atualiza todos os campos vindos do frontend
        activity.title = data.get('title', activity.title)
        activity.description = data.get('description', activity.description)
        activity.area_knowledge = data.get('areaKnowledge', activity.area_knowledge)
        activity.is_public = data.get('isPublic', activity.is_public)
        
        # Se o frontend enviar isDraft: false, o backend acata e publica a atividade.
        if 'isDraft' in data:
            activity.is_draft = data['isDraft']
        elif 'is_draft' in data:
            activity.is_draft = data['is_draft']
        
        activity.current_scenario = data.get('currentScenario', activity.current_scenario)
        activity.desired_scenario = data.get('desiredScenario', activity.desired_scenario)
        activity.activity_planning = data.get('activityPlanning', activity.activity_planning)
        activity.player_profile = data.get('playerProfile', activity.player_profile)
        activity.game_elements = data.get('gameElements', activity.game_elements)
        activity.rewards_offered = data.get('rewardsOffered', activity.rewards_offered)
        activity.rewarded_actions = data.get('rewardedActions', activity.rewarded_actions)
        activity.gamification_rules = data.get('gamificationRules', activity.gamification_rules)
        
        # 1. Nossa correção para salvar o tabuleiro de gamificação
        if 'gamificationDesign' in data:
            activity.gamification_design = data['gamificationDesign']
        
        # 2. O log de eventos importante da segunda versão
        _log_system_event(
            user_id=user.id,
            action='activity_edited',
            activity_id=activity.id
        )
        
        db.session.commit()
        logger.info(f"Atividade ID {activity_id} atualizada com sucesso pelo usuário ID {user.id}")
        return {"message": "Atividade atualizada com sucesso", "activity": activity.to_dict()}, 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao atualizar atividade ID {activity_id}: {str(e)}")
        return {"message": str(e)}, 500

        
def search_activities(search_term, tags):
    query = Activity.query.filter(Activity.is_public == True)
    
    if search_term:
        query = query.filter(
            (Activity.title.ilike(f'%{search_term}%')) |
            (Activity.description.ilike(f'%{search_term}%'))
        )
    
    if tags:
        query = query.join(Activity.tags).filter(Tag.name.in_(tags))
    
    results = query.all()
    return jsonify([a.to_dict() for a in results])

def create_revision(user, activity_id, data):
    activity = Activity.query.get(activity_id)
    if not activity or activity.professor_id != user.id:
        return {"message": "Acesso negado"}, 403
    
    try:
        revision = ActivityRevision(
            activity_id=activity_id,
            revision_data=activity.to_dict(),  # Salva snapshot atual
            revision_notes=data.get('notes'),
            revised_by_id=user.id
        )
        
        # Atualizar atividade principal
        for field in data.get('updates', {}):
            setattr(activity, field, data['updates'][field])
        
        db.session.add(revision)
        db.session.commit()
        
        return {"message": "Revisão criada"}, 201
    
    except Exception as e:
        db.session.rollback()
        return {"message": str(e)}, 500



def get_activity(user, activity_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    activity = Activity.query.get(activity_id)

    if not user:
        return jsonify({"message": "Usuário não encontrado."}), 404

    if not activity:
        return jsonify({"message": "Atividade não encontrada."}), 404

    # Lógica de autorização: quem pode ver a atividade?
    is_owner = activity.professor_id == user.id
    is_public = activity.is_public
    is_enrolled_student = user.role == 'aluno' and activity.class_id and Enrollment.query.filter_by(student_id=user.id, class_id=activity.class_id).first()

    # Permite o acesso se o usuário for o dono, a atividade for pública, ou se for um aluno matriculado
    if not (is_owner or is_public or is_enrolled_student):
        return jsonify({"message": "Acesso negado."}), 403
    
    # 1. Converte a atividade principal para um dicionário
    activity_dict = activity.to_dict()

    # 2. Busca todos os conteúdos de quiz e narrativa associados a esta atividade
    quiz_contents = QuizContent.query.filter_by(activity_id=activity_id).all()
    narrative_contents = NarrativeContent.query.filter_by(activity_id=activity_id).all()
    learning_contents = LearningContent.query.filter_by(activity_id=activity_id).all()
    
    # 3. Cria um mapa (dicionário) para acesso rápido ao conteúdo pelo step_id
    content_map = {}
    for qc in quiz_contents:
        content_map[qc.step_id] = {
            'type': 'quiz',
            'questions': qc.questions
        }
    for nc in narrative_contents:
        content_map[nc.step_id] = {
            'type': 'narrative',
            'scenario': nc.scenario,
            'characters': nc.characters,
            'dialogue': nc.dialogue
        }
    
    for lc in learning_contents:
        content_map[lc.step_id] = {
            'type': 'content', # Identificador que usaremos no Frontend
            'video_url': lc.video_url,
            'text_content': lc.text_content,
            'material_link': lc.material_link
        }

    # 4. Anexa o conteúdo (O código existente já resolve isso pq usamos o content_map genérico)
    if activity_dict.get('gamificationDesign') and 'progression_path' in activity_dict['gamificationDesign']:
        for step in activity_dict['gamificationDesign']['progression_path']:
            step_id = step.get('id')
            if step_id in content_map:
                step['content'] = content_map[step_id]
                # Força o tipo do passo a ser o tipo do conteúdo para garantir consistência
                step['type'] = content_map[step_id]['type']
    

    # 5. Retorna o dicionário da atividade agora "enriquecido" com o conteúdo
    return jsonify(activity_dict), 200


def get_activities_by_professor(professor_id, search_term=None):
    """Busca todas as atividades OFICIAIS (não rascunhos) criadas por um professor."""
    logger.info(f"Buscando atividades oficiais para o professor ID {professor_id}")
    
    # CORREÇÃO: Adicionado filtro is_draft=False (ou None)
    # Usamos o operador 'isnot' ou comparamos com False explicitamente
    query = Activity.query.filter(
        Activity.professor_id == professor_id,
        Activity.is_draft.isnot(True) # Garante que rascunhos (True) fiquem de fora
    )

    if search_term:
        query = query.outerjoin(Class, Activity.class_id == Class.id)
        query = query.filter(
            or_(
                Activity.title.ilike(f'%{search_term}%'),
                Activity.description.ilike(f'%{search_term}%'),
                Class.name.ilike(f'%{search_term}%')
            )
        )
    
    activities = query.all()
    return [a.to_dict() for a in activities]

def get_public_activities(current_user_id, search_term=None):
    """Busca todas as atividades públicas, com filtro opcional."""
    logger.info(f"Buscando atividades públicas para o usuário ID {current_user_id} com termo de busca: '{search_term}'")
    query = Activity.query.filter(Activity.is_public == True, Activity.professor_id != current_user_id)
    
    # --- 3. LÓGICA DE BUSCA ATUALIZADA (IDÊNTICA À DE CIMA) ---
    if search_term:
        query = query.outerjoin(Class, Activity.class_id == Class.id)
        query = query.filter(
            or_(
                Activity.title.ilike(f'%{search_term}%'),
                Activity.description.ilike(f'%{search_term}%'),
                Class.name.ilike(f'%{search_term}%')
            )
        )

    activities = query.all()
    return [a.to_dict() for a in activities]



def copy_activity(user, activity_id):
    """Copia uma atividade, permitindo que o professor copie seus próprios templates ou atividades públicas."""
    original_activity = Activity.query.get(activity_id)

    if not original_activity:
        return {"message": "Atividade original não encontrada"}, 404
    
    # --- LÓGICA DE PERMISSÃO REATORADA PARA MAIOR CLAREZA ---
    is_owner = original_activity.professor_id == user.id
    is_public = original_activity.is_public

    if not is_owner and not is_public:
        return {"message": "Você não tem permissão para copiar esta atividade."}, 403

    try:
        # --- INÍCIO DA CORREÇÃO ---
        
        # 1. Cria a nova atividade com todos os campos, incluindo o gamification_design
        copied_activity = Activity(
            professor_id=user.id,
            title=f"Cópia de: {original_activity.title}",
            description=original_activity.description,
            # É crucial usar deepcopy para JSONs para evitar que as alterações na cópia afetem o original
            current_scenario=deepcopy(original_activity.current_scenario),
            desired_scenario=deepcopy(original_activity.desired_scenario),
            activity_planning=deepcopy(original_activity.activity_planning),
            player_profile=deepcopy(original_activity.player_profile),
            game_elements=deepcopy(original_activity.game_elements),
            rewards_offered=deepcopy(original_activity.rewards_offered),
            rewarded_actions=deepcopy(original_activity.rewarded_actions),
            gamification_rules=deepcopy(original_activity.gamification_rules),
            gamification_design=deepcopy(original_activity.gamification_design), # <-- CAMPO QUE FALTAVA
            area_knowledge=original_activity.area_knowledge,
            is_public=False,
            class_id=None
        )

        # Atualiza o contador de cópias da atividade original
        original_activity.copy_count += 1
        
        db.session.add(original_activity)
        db.session.add(copied_activity)

        # USA-SE O FLUSH PARA OBTER O ID DA NOVA ATIVIDADE ANTES DO COMMIT
        # Isto é necessário para que possamos associar os novos itens da loja a ela.
        db.session.flush()

        # 2. COPIA OS ITENS DA LOJA ASSOCIADOS À ATIVIDADE ORIGINAL
        original_items = StoreItem.query.filter_by(activity_id=original_activity.id).all()
        for item in original_items:
            # Cria uma nova instância de StoreItem para a atividade copiada
            new_item = StoreItem(
                activity_id=copied_activity.id, # Associa ao ID da nova atividade
                name=item.name,
                description=item.description,
                price=item.price,
                icon=item.icon,
                item_type=item.item_type,
                effect_id=deepcopy(item.effect_id)
            )
            db.session.add(new_item)

        # --- FIM DA CORREÇÃO ---

        db.session.commit() # Salva tudo (nova atividade e novos itens da loja) na base de dados

        _log_system_event(
            user_id=user.id,
            action='activity_copied',
            activity_id=copied_activity.id,
            details={'original_activity_id': original_activity.id}
        )
        logger.info(f"Atividade ID {activity_id} copiada para o usuário ID {user.id}. Nova atividade ID: {copied_activity.id}")
        return {"message": "Atividade copiada com sucesso!", "activity": copied_activity.to_dict()}, 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao copiar atividade ID {activity_id} para usuário ID {user.id}: {str(e)}")
        return {"message": str(e)}, 500

def bulk_delete_activities(user, activity_ids):
    if not isinstance(activity_ids, list) or not all(isinstance(i, int) for i in activity_ids):
        return {"message": "Entrada inválida. Esperava-se uma lista de IDs numéricos."}, 400

    activities_to_delete = Activity.query.filter(
        Activity.id.in_(activity_ids),
        Activity.professor_id == user.id
    ).all()

    if not activities_to_delete:
        return {"message": "Nenhuma atividade válida para exclusão foi encontrada ou você não tem permissão."}, 404

    deleted_count = len(activities_to_delete)
    ids_to_delete = [act.id for act in activities_to_delete]

    try:
        # 1. Limpeza de Itens da Loja (Cosméticos equipados)
        item_ids_to_delete = [item.id for item in StoreItem.query.filter(StoreItem.activity_id.in_(ids_to_delete)).all()]
        
        if item_ids_to_delete:
            ActivityProgress.query.filter(
                ActivityProgress.equipped_name_cosmetic_id.in_(item_ids_to_delete)
            ).update({'equipped_name_cosmetic_id': None}, synchronize_session=False)

            ActivityProgress.query.filter(
                ActivityProgress.equipped_title_cosmetic_id.in_(item_ids_to_delete)
            ).update({'equipped_title_cosmetic_id': None}, synchronize_session=False)
        
        # 2. Limpeza de CHAT (Conversas e Mensagens) - CORREÇÃO DO ERRO
        conversations = Conversation.query.filter(Conversation.activity_id.in_(ids_to_delete)).all()
        conv_ids = [c.id for c in conversations]
        if conv_ids:
            ChatMessage.query.filter(ChatMessage.conversation_id.in_(conv_ids)).delete(synchronize_session=False)
            Conversation.query.filter(Conversation.id.in_(conv_ids)).delete(synchronize_session=False)

        # 3. Limpeza de AVALIAÇÕES (Ratings) - NOVA FUNCIONALIDADE
        ActivityRating.query.filter(ActivityRating.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)

        # 4. Deleta os demais registros filhos
        Purchase.query.filter(Purchase.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)
        StoreItem.query.filter(StoreItem.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)
        SlotWin.query.filter(SlotWin.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)
        RouletteWin.query.filter(RouletteWin.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)
        StudentResponse.query.filter(StudentResponse.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)
        
        QuizContent.query.filter(QuizContent.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)
        NarrativeContent.query.filter(NarrativeContent.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)
        UserUnlockedTitle.query.filter(UserUnlockedTitle.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)
        ActivityProgress.query.filter(ActivityProgress.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)
        EventLog.query.filter(EventLog.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)
        ActivityRevision.query.filter(ActivityRevision.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)
        UserUnlockedMedal.query.filter(UserUnlockedMedal.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)
        
        # 5. Apaga as atividades
        for activity in activities_to_delete:
            db.session.delete(activity)

        db.session.commit()

        _log_system_event(
            user_id=user.id,
            action='activity_bulk_deleted',
            details={'deleted_count': deleted_count, 'deleted_ids': ids_to_delete}
        )

        return {"message": f"{deleted_count} atividades foram deletadas com sucesso!"}, 200

    except Exception as e:
        db.session.rollback()
        return {"message": f"Erro interno ao deletar atividades: {str(e)}"}, 500
    
    
    
def save_autosave(user, data):
    """
    Salva o estado atual da criação como rascunho.
    Funciona como UPSERT: Cria se não tiver ID, Atualiza se tiver.
    """
    activity_id = data.get('id')
    
    # Prepara os dados comuns (extração segura com fallback)
    # NOTA: O Frontend envia camelCase (ex: gamificationDesign), 
    # então usamos .get('gamificationDesign')
    update_data = {
        'title': data.get('title') or "Rascunho sem nome",
        'description': data.get('description', ''),
        'area_knowledge': data.get('areaKnowledge', ''),
        # Mapeamento camelCase -> snake_case do Banco
        'current_scenario': data.get('currentScenario', {}),
        'desired_scenario': data.get('desiredScenario', {}),
        'activity_planning': data.get('activityPlanning', {}),
        'player_profile': data.get('playerProfile', {}),
        'game_elements': data.get('gameElements', {}),
        'rewards_offered': data.get('rewardsOffered', {}),
        'rewarded_actions': data.get('rewardedActions', {}),
        'gamification_rules': data.get('gamificationRules', {}),
        # CORREÇÃO CRÍTICA DA TRILHA DO TABULEIRO:
        # Tenta pegar 'gamificationDesign' (frontend) ou 'gamification_design' (fallback)
        'gamification_design': data.get('gamificationDesign', data.get('gamification_design', {}))
    }

    # --- CASO 1: ATUALIZAÇÃO (Já existe ID) ---
    if activity_id:
        activity = Activity.query.get(activity_id)
        if not activity:
            return {"message": "Rascunho não encontrado (pode ter expirado)."}, 404
        if activity.professor_id != user.id:
            return {"message": "Acesso negado."}, 403
        
        # Atualiza campos
        for key, value in update_data.items():
            setattr(activity, key, value)
        
        activity.updated_at = datetime.utcnow()
        
        try:
            db.session.commit()
            return {"id": activity.id, "status": "updated", "updated_at": activity.updated_at.isoformat()}, 200
        except Exception as e:
            db.session.rollback()
            return {"message": str(e)}, 500

    # --- CASO 2: CRIAÇÃO (Primeiro Autosave) ---
    else:
        try:
            # Cria rascunho
            new_draft = Activity(
                professor_id=user.id,
                is_draft=True,  # Flag importante
                **update_data   # Desempacota o dicionário criado acima
            )
            
            db.session.add(new_draft)
            db.session.flush() # Gera ID
            
            # Popula loja no rascunho também!
            _populate_default_store(new_draft.id)
            
            db.session.commit()
            return {"id": new_draft.id, "status": "created", "updated_at": new_draft.created_at.isoformat()}, 201
            
        except Exception as e:
            db.session.rollback()
            return {"message": f"Erro ao criar rascunho: {str(e)}"}, 500
        
def _populate_default_store(activity_id):
    """
    Helper interno para popular a loja.
    CORREÇÃO: Usar 'activity_id' (parâmetro) em vez de 'new_activity.id'.
    """
    try:
        # Adiciona Cosméticos Padrão
        for item_data in DEFAULT_COSMETICS:
            
            
            db.session.add(StoreItem(activity_id=activity_id, **item_data))
            
        # Adiciona Avatares Padrão
        for item_data in DEFAULT_AVATARS:
            db.session.add(StoreItem(activity_id=activity_id, **item_data))
        
        # Adiciona Títulos Padrão
        for item_data in DEFAULT_TITLES:
            title_effect_id = item_data["effect_id"]
            existing_title = Title.query.filter_by(effect_id=title_effect_id).first()
            if not existing_title:
                db.session.add(Title(
                    effect_id=title_effect_id,
                    display_text=item_data["name"],
                    description=item_data["description"]
                ))
            
            db.session.add(StoreItem(
                activity_id=activity_id,
                name=item_data["name"],
                description=item_data["description"],
                price=item_data["price"],
                icon=item_data["icon"],
                item_type=item_data["item_type"],
                effect_id=title_effect_id
            ))
            
    except Exception as e:
        logger.error(f"Erro ao popular loja padrão: {str(e)}")
        # Não damos raise para não travar o autosave por causa de loja

def get_user_drafts(user_id):
    """Retorna rascunhos recentes do usuário."""
    # Filtro de segurança visual (embora o job apague depois)
    limit_date = datetime.utcnow() - timedelta(days=7)
    
    drafts = Activity.query.filter(
        Activity.professor_id == user_id,
        Activity.is_draft == True,
        Activity.updated_at >= limit_date
    ).order_by(Activity.updated_at.desc()).all()
    
    return [d.to_dict() for d in drafts]

def publish_draft(user, activity_id, data):
    """Finaliza o rascunho transformando-o em atividade oficial."""
    activity = Activity.query.get(activity_id)
    if not activity or activity.professor_id != user.id:
        return {"message": "Rascunho não encontrado."}, 404
        
    # Atualiza com os dados finais do formulário
    update_response = update_activity(user, activity_id, data)
    
    if update_response[1] != 200:
        return update_response # Retorna erro se o update falhar
        
    # Vira oficial
    activity.is_draft = False
    activity.is_public = data.get('isPublic', False) # Respeita a escolha final
    db.session.commit()
    
    return {"message": "Atividade publicada com sucesso!", "activity": activity.to_dict()}, 200
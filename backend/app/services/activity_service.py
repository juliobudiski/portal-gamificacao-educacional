from .. import db
from ..models import Activity, ActivityRevision, Tag, EventLog, ActivityProgress 
from flask import jsonify
import logging
from flask_jwt_extended import jwt_required, current_user, get_jwt_identity
from ..models import db, Activity, Tag, activity_tag, ActivityRevision, User, Class, Enrollment
from sqlalchemy.orm import noload
from copy import deepcopy
from sqlalchemy import or_

logger = logging.getLogger(__name__)

def create_activity(user, data):
    logger.info(f"Usuário ID {user.id} tentando criar uma nova atividade.")

    if user.role != 'professor':
        return {"message": "Acesso negado"}, 403
    
    try:
        # A lógica para narrative_image_url é removida daqui
        new_activity = Activity(
            professor_id=user.id,
            title=data.get('title'),
            description=data.get('description', ''),
            current_scenario=data.get('currentScenario', {}),
            desired_scenario=data.get('desiredScenario', {}),
            activity_planning=data.get('activityPlanning', {}),
            player_profile=data.get('playerProfile', {}),
            game_elements=data.get('gameElements', {}), # A nova estrutura da narrativa virá aqui dentro
            rewards_offered=data.get('rewardsOffered', {}),
            rewarded_actions=data.get('rewardedActions', {}),
            gamification_rules=data.get('gamificationRules', {}),
            area_knowledge=data.get('areaKnowledge'),
            is_public=data.get('isPublic', False)
        )
        
        if 'tags' in data:
            for tag_name in data['tags']:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                new_activity.tags.append(tag)
        
        db.session.add(new_activity)
        db.session.commit()
        
        log_event(user.id, 'activity_created', {
            'activity_id': new_activity.id,
            'title': new_activity.title
        })
        
        return {"message": "Atividade criada", "activity": new_activity.to_dict()}, 201
    
    except Exception as e:
        db.session.rollback()
        return {"message": str(e)}, 500

def update_activity(user, activity_id, data):
    activity = Activity.query.get(activity_id)

    if not activity:
        return {"message": "Atividade não encontrada"}, 404
    
    if activity.professor_id != user.id:
        return {"message": "Acesso negado. Você não é o dono desta atividade."}, 403

    try:
        activity.title = data.get('title', activity.title)
        activity.description = data.get('description', activity.description)
        activity.area_knowledge = data.get('areaKnowledge', activity.area_knowledge)
        activity.is_public = data.get('isPublic', activity.is_public)
        activity.current_scenario = data.get('currentScenario', activity.current_scenario)
        activity.desired_scenario = data.get('desiredScenario', activity.desired_scenario)
        activity.activity_planning = data.get('activityPlanning', activity.activity_planning)
        activity.player_profile = data.get('playerProfile', activity.player_profile)
        # O campo game_elements agora carrega toda a estrutura da narrativa
        activity.game_elements = data.get('gameElements', activity.game_elements)
        activity.rewards_offered = data.get('rewardsOffered', activity.rewards_offered)
        activity.rewarded_actions = data.get('rewardedActions', activity.rewarded_actions)
        activity.gamification_rules = data.get('gamificationRules', activity.gamification_rules)
        
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

# Função auxiliar para registro de eventos
def log_event(user_id, event_type, event_data):
    from ..models import EventLog
    event = EventLog(
        user_id=user_id,
        event_type=event_type,
        event_data=event_data
    )
    db.session.add(event)
    db.session.commit()


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

    return jsonify(activity.to_dict()), 200


def get_activities_by_professor(professor_id, search_term=None):
    """Busca todas as atividades criadas por um professor, com filtro opcional."""
    logger.info(f"Buscando atividades para o professor ID {professor_id} com termo de busca: '{search_term}'")
    query = Activity.query.filter_by(professor_id=professor_id)

    # --- 2. LÓGICA DE BUSCA ATUALIZADA ---
    if search_term:
        # Faz um "join" com a tabela de Turmas para conseguir pesquisar pelo nome da turma
        query = query.outerjoin(Class, Activity.class_id == Class.id)
        # Filtra usando OR para buscar em qualquer um dos três campos
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

def update_activity(user, activity_id, data):
    """Atualiza uma atividade existente."""
    activity = Activity.query.get(activity_id)

    if not activity:
        return {"message": "Atividade não encontrada"}, 404
    
    # Apenas o professor que criou a atividade pode editá-la
    if activity.professor_id != user.id:
        return {"message": "Acesso negado. Você não é o dono desta atividade."}, 403

    try:
        # Atualiza os campos
        activity.title = data.get('title', activity.title)
        activity.description = data.get('description', activity.description)
        activity.area_knowledge = data.get('areaKnowledge', activity.area_knowledge)
        activity.is_public = data.get('isPublic', activity.is_public)
        activity.current_scenario = data.get('currentScenario', activity.current_scenario)
        activity.desired_scenario = data.get('desiredScenario', activity.desired_scenario)
        activity.activity_planning = data.get('activityPlanning', activity.activity_planning)
        activity.player_profile = data.get('playerProfile', activity.player_profile)
        activity.game_elements = data.get('gameElements', activity.game_elements)
        activity.rewards_offered = data.get('rewardsOffered', activity.rewards_offered)
        activity.rewarded_actions = data.get('rewardedActions', activity.rewarded_actions)
        activity.gamification_rules = data.get('gamificationRules', activity.gamification_rules)
        
        db.session.commit()
        logger.info(f"Atividade ID {activity_id} atualizada com sucesso pelo usuário ID {user.id}")
        return {"message": "Atividade atualizada com sucesso", "activity": activity.to_dict()}, 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao atualizar atividade ID {activity_id}: {str(e)}")
        return {"message": str(e)}, 500

def copy_activity(user, activity_id):
    """Copia uma atividade pública para o professor logado."""
    original_activity = Activity.query.get(activity_id)

    if not original_activity:
        return {"message": "Atividade original não encontrada"}, 404
    
    if not original_activity.is_public:
        return {"message": "Só é possível copiar atividades públicas."}, 403

    try:
        # Clona os dados da atividade original
        new_activity_data = original_activity.to_dict()
        original_activity.copy_count += 1

        copied_activity = Activity(
            professor_id=user.id, # Novo dono
            title=f"Cópia de: {new_activity_data['title']}", # Adiciona "Cópia de:" ao título
            description=new_activity_data['description'],
            current_scenario=new_activity_data['currentScenario'],
            desired_scenario=new_activity_data['desiredScenario'],
            activity_planning=new_activity_data['activityPlanning'],
            player_profile=new_activity_data['playerProfile'],
            game_elements=new_activity_data['gameElements'],
            rewards_offered=new_activity_data['rewardsOffered'],
            rewarded_actions=new_activity_data['rewardedActions'],
            gamification_rules=new_activity_data['gamificationRules'],
            area_knowledge=new_activity_data['areaKnowledge'],
            is_public=False,  # A cópia começa como privada
            class_id=None # A cópia não é atribuída a nenhuma turma
        )

        db.session.add(original_activity)
        db.session.add(copied_activity)
        db.session.commit()
        
        logger.info(f"Atividade ID {activity_id} copiada para o usuário ID {user.id}. Nova atividade ID: {copied_activity.id}")
        return {"message": "Atividade copiada com sucesso!", "activity": copied_activity.to_dict()}, 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao copiar atividade ID {activity_id} para usuário ID {user.id}: {str(e)}")
        return {"message": str(e)}, 500

def bulk_delete_activities(user, activity_ids):
    """
    Deleta uma lista de atividades em massa, verificando a propriedade de cada uma.
    """
    if not isinstance(activity_ids, list) or not all(isinstance(i, int) for i in activity_ids):
        return {"message": "Entrada inválida. Esperava-se uma lista de IDs numéricos."}, 400

    # Busca todas as atividades que correspondem aos IDs fornecidos E que pertencem ao usuário logado.
    # Esta é a verificação de segurança crucial.
    activities_to_delete = Activity.query.filter(
        Activity.id.in_(activity_ids),
        Activity.professor_id == user.id
    ).all()

    if not activities_to_delete:
        return {"message": "Nenhuma atividade válida para exclusão foi encontrada ou você não tem permissão."}, 404

    deleted_count = len(activities_to_delete)
    ids_to_delete = [act.id for act in activities_to_delete]

    try:
        # Passo 1: Deletar registros dependentes primeiro para evitar erros de chave estrangeira.
        # Esta operação é mais eficiente do que deletar em um loop.
        ActivityProgress.query.filter(ActivityProgress.activity_id.in_(ids_to_delete)).delete(synchronize_session=False)

        # Passo 2: Deletar as atividades em si.
        for activity in activities_to_delete:
            db.session.delete(activity)

        db.session.commit()
        logger.info(f"Usuário ID {user.id} deletou {deleted_count} atividades em massa.")
        return {"message": f"{deleted_count} atividades foram deletadas com sucesso!"}, 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao deletar atividades em massa para o usuário ID {user.id}: {str(e)}")
        return {"message": "Erro interno ao deletar atividades."}, 500
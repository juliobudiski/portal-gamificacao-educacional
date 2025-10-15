# backend/app/routes/admin.py
from flask_cors import cross_origin 
from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, User, Activity, EventLog, Purchase, ActivityProgress
from sqlalchemy import func, case, cast, Numeric
from datetime import datetime, timedelta
from collections import Counter
import requests
admin_bp = Blueprint('admin', __name__)

# Função auxiliar para verificar se o usuário é admin
def check_admin():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user and user.role == 'admin'

# Rota para dados dos cards (KPIs)
@admin_bp.route('/dashboard_data', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    if not check_admin():
        return jsonify({"message": "Acesso negado."}), 403
    
    total_users = User.query.count()
    total_professors = User.query.filter_by(role='professor').count()
    total_students = User.query.filter_by(role='aluno').count()
    total_activities = Activity.query.count()
    
    return jsonify({
        "total_users": total_users,
        "total_professors": total_professors,
        "total_students": total_students,
        "total_activities": total_activities,
    })

# Rota para listar todos os usuários
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    if not check_admin():
        return jsonify({"message": "Acesso negado"}), 403
    users = User.query.order_by(User.id).all()
    return jsonify([u.to_dict() for u in users])

# Rota para listar todas as atividades
@admin_bp.route('/activities', methods=['GET'])
@jwt_required()
def get_all_activities():
    if not check_admin():
        return jsonify({"message": "Acesso não autorizado"}), 403

    # Subconsulta para calcular o tempo médio de engajamento por atividade
    engagement_subquery = db.session.query(
        EventLog.activity_id,
        func.avg(cast(EventLog.details['duration_seconds'].astext, Numeric)).label('avg_duration')
    ).filter(
        EventLog.action == 'view_duration',
        EventLog.activity_id.isnot(None),
        EventLog.details['duration_seconds'].isnot(None)
    ).group_by(EventLog.activity_id).subquery()

    activities_with_professors = db.session.query(
        Activity, User.name.label('professor_name'), engagement_subquery.c.avg_duration
    ).join(User, User.id == Activity.professor_id
    ).outerjoin(engagement_subquery, engagement_subquery.c.activity_id == Activity.id).all()
    
    activities_list = []
    for activity, professor_name, avg_duration in activities_with_professors:
        act_dict = activity.to_dict()
        act_dict['professor_name'] = professor_name
        # Convertendo a duração média para formato legível
        if avg_duration is not None:
            # Converter para minutos e segundos
            minutes = int(avg_duration // 60)
            seconds = int(avg_duration % 60)
            act_dict['average_engagement_time'] = f"{minutes}m {seconds}s"
        else:
            act_dict['average_engagement_time'] = 'N/A'
        activities_list.append(act_dict)

    return jsonify(activities_list)


# --- ROTAS CORRIGIDAS PARA OS GRÁFICOS E FEED ---


@admin_bp.route('/stats/user_growth', methods=['GET'])
@jwt_required()
def get_user_growth_stats():
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403

    # --- LÓGICA APRIMORADA ---
    # 1. Encontra a data do primeiro registro de usuário
    first_registration = db.session.query(func.min(EventLog.created_at)).filter(EventLog.action == 'register_success').scalar()
    
    # Se não houver registros, retorna vazio
    if not first_registration:
        return jsonify([])

    # 2. Define o período: dos últimos 30 dias a partir de hoje, mas não antes do primeiro registro.
    start_date = max(first_registration.date(), (datetime.utcnow() - timedelta(days=29)).date())
    end_date = datetime.utcnow().date()
    
    # 3. Gera todas as datas no intervalo para garantir que dias sem registros apareçam com valor 0.
    date_series = [start_date + timedelta(days=x) for x in range((end_date - start_date).days + 1)]
    
    # 4. Busca os dados de registro
    results = db.session.query(
        func.date(EventLog.created_at).label('day'),
        func.count(EventLog.id).label('new_users')
    ).filter(
        EventLog.created_at >= start_date,
        EventLog.action == 'register_success'
    ).group_by(func.date(EventLog.created_at)).all()
    
    # 5. Combina os resultados com a série de datas
    registrations_by_date = {res.day: res.new_users for res in results}
    chart_data = [{"date": day.strftime('%d/%m'), "Novos Usuários": registrations_by_date.get(day, 0)} for day in date_series]
    
    return jsonify(chart_data)


@admin_bp.route('/stats/top_activities', methods=['GET'])
@jwt_required()
def get_top_activities_stats():
    if not check_admin():
        return jsonify({"message": "Acesso negado."}), 403

    top_activities = Activity.query.filter(Activity.copy_count > 0).order_by(Activity.copy_count.desc()).limit(5).all()
    
    chart_data = [
        {"name": activity.title[:25] + '...' if len(activity.title) > 25 else activity.title, "Cópias": activity.copy_count}
        for activity in top_activities
    ]
    return jsonify(chart_data)


@admin_bp.route('/feed', methods=['GET'])
@jwt_required()
def get_activity_feed():
    if not check_admin():
        return jsonify({"message": "Acesso negado."}), 403

    # --- MELHORIA APLICADA AQUI ---
    # Adicionamos um filtro para que eventos de usuários 'admin' não apareçam no feed.
    recent_events = db.session.query(EventLog, User.name) \
                              .join(User, User.id == EventLog.user_id) \
                              .filter(User.role != 'admin') \
                              .order_by(EventLog.created_at.desc()) \
                              .limit(10).all()
    feed_items = []
    for event, user_name in recent_events:
        item = {
            "id": event.id,
            "user_name": user_name,
            "action": event.action,
            "section": event.section,
            "details": event.details,
            "timestamp": event.created_at.isoformat()
        }
        feed_items.append(item)
        
    return jsonify(feed_items)




@admin_bp.route('/analytics/event_distribution', methods=['GET'])
@jwt_required()
def get_event_distribution():
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403
    
    distribution = db.session.query(
        EventLog.action,
        func.count(EventLog.id).label('count')
    ).group_by(EventLog.action).order_by(func.count(EventLog.id).desc()).limit(10).all()
    
    chart_data = [{"action": row.action.replace('_', ' ').title(), "count": row.count} for row in distribution]
    return jsonify(chart_data)


@admin_bp.route('/analytics/logs', methods=['GET'])
@jwt_required()
def get_system_logs():
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 15, type=int)
    search_user = request.args.get('user', None, type=str)
    filter_action = request.args.get('action', None, type=str)
    
    query = db.session.query(
        EventLog, 
        User.name, 
        User.email, 
        User.last_known_latitude, 
        User.last_known_longitude
    ).join(User, User.id == EventLog.user_id)

    if search_user:
        query = query.filter(User.name.ilike(f'%{search_user}%'))
    if filter_action:
        query = query.filter(EventLog.action == filter_action)
    
    query = query.order_by(EventLog.created_at.desc())
    
    paginated_logs = query.paginate(page=page, per_page=per_page, error_out=False)
    
    logs_data = []
    # --- LÓGICA DE GEOLOCALIZAÇÃO CORRIGIDA ---
    for log, user_name, user_email, lat, lon in paginated_logs.items:
        log_data = {
            "id": log.id,
            "user_name": user_name,
            "user_email": user_email,
            "action": log.action,
            "section": log.section,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": log.created_at.isoformat(),
            "location": None # Começa como nulo
        }

        # Se o usuário tiver uma lat/lon registrada, buscamos a cidade
        if lat and lon:
            try:
                geo_url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
                headers = {'User-Agent': 'GamificaEduPortal/1.0'}
                geo_res = requests.get(geo_url, headers=headers, timeout=5)
                geo_res.raise_for_status()
                geo_data = geo_res.json()
                address = geo_data.get('address', {})
                
                log_data['location'] = {
                    'city': address.get('city') or address.get('town') or address.get('village', 'N/A'),
                    'state': address.get('state', 'N/A'),
                    'country': address.get('country', 'N/A')
                }
            except requests.exceptions.RequestException as e:
                current_app.logger.error(f"Falha na geocodificação para o log ID {log.id}: {e}")
                log_data['location'] = None
            
        logs_data.append(log_data)
        
    return jsonify({
        "logs": logs_data,
        "total_pages": paginated_logs.pages,
        "current_page": paginated_logs.page,
        "has_next": paginated_logs.has_next,
        "has_prev": paginated_logs.has_prev
    })


@admin_bp.route('/analytics/creation_trends', methods=['GET'])
@jwt_required()
@cross_origin()
def get_creation_trends():
    if not check_admin(): 
        return jsonify({"message": "Acesso negado."}), 403

    activities = Activity.query.all()
    if not activities:
        return jsonify({
            "game_elements": [], "player_profiles": [],
            "rewarded_actions": [], "rewards_offered": []
        })

    # Mapeamento para normalizar os nomes dos perfis
    profile_mapping = {
        "Jogador cooperativo": "Cooperativo",
        "Jogador de realização": "Realizador",
        "Jogador imersivo": "Imersivo",
        "Jogador competitivo": "Competitivo",
        "Jogador social": "Social"        
    }

    game_elements_counter = Counter()
    player_profiles_counter = Counter()
    rewarded_actions_counter = Counter()
    rewards_offered_counter = Counter()

    for activity in activities:
        # Processar player profiles
        if activity.player_profile and 'selectedProfiles' in activity.player_profile:
            profiles = activity.player_profile['selectedProfiles']
            
            # Se for uma string, converter para array
            if isinstance(profiles, str):
                profiles = [p.strip() for p in profiles.split(',')]
            
            # Normalizar os nomes
            normalized_profiles = [
                profile_mapping.get(profile, profile) 
                for profile in profiles
            ]
            player_profiles_counter.update(normalized_profiles)
            
        # Processar game elements
        if activity.game_elements and 'selectedElements' in activity.game_elements:
            elements = activity.game_elements['selectedElements']
            if isinstance(elements, str):
                elements = [e.strip() for e in elements.split(',')]
            game_elements_counter.update(elements)
            
        # Processar rewarded actions
        if activity.rewarded_actions and 'selectedActions' in activity.rewarded_actions:
            actions = activity.rewarded_actions['selectedActions']
            if isinstance(actions, str):
                actions = [a.strip() for a in actions.split(',')]
            rewarded_actions_counter.update(actions)
            
        # Processar rewards offered
        if activity.rewards_offered and 'selectedRewards' in activity.rewards_offered:
            rewards = activity.rewards_offered['selectedRewards']
            if isinstance(rewards, str):
                rewards = [r.strip() for r in rewards.split(',')]
            rewards_offered_counter.update(rewards)
            
    # Função auxiliar para formatar os dados para os gráficos
    def format_counter_data(counter, name_key='name', value_key='count'):
        return [{name_key: item, value_key: count} for item, count in counter.most_common(10)]

    return jsonify({
        "game_elements": format_counter_data(game_elements_counter, 'element', 'count'),
        "player_profiles": format_counter_data(player_profiles_counter, 'profile', 'count'),
        "rewarded_actions": format_counter_data(rewarded_actions_counter, 'action', 'count'),
        "rewards_offered": format_counter_data(rewards_offered_counter, 'reward', 'count')
    })

@admin_bp.route('/analytics/kpis', methods=['GET'])
@jwt_required()
def get_analytics_kpis():
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403

    # Contagem total de eventos
    total_events = db.session.query(func.count(EventLog.id)).scalar()

    # Contagem de logins (sucesso e falha) nas últimas 24h
    one_day_ago = datetime.utcnow() - timedelta(hours=24)
    logins_today = db.session.query(
        func.count(case((EventLog.action == 'login_success', 1))),
        func.count(case((EventLog.action == 'login_fail', 1)))
    ).filter(EventLog.created_at >= one_day_ago).first()

    # Contagem de atividades criadas nos últimos 7 dias
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    activities_this_week = db.session.query(func.count(EventLog.id)).filter(
        EventLog.action == 'activity_created',
        EventLog.created_at >= one_week_ago
    ).scalar()

    # NOVOS KPIs: Logins dos últimos 30 dias e usuários ativos (únicos) nos últimos 30 dias
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Total de logins com sucesso nos últimos 30 dias
    successful_logins_30d = db.session.query(func.count(EventLog.id)).filter(
        EventLog.action == 'login_success',
        EventLog.created_at >= thirty_days_ago
    ).scalar()

    # Número de usuários distintos que fizeram login nos últimos 30 dias
    active_users_30d = db.session.query(func.count(func.distinct(EventLog.user_id))).filter(
        EventLog.action == 'login_success',
        EventLog.created_at >= thirty_days_ago
    ).scalar()

    return jsonify({
        "total_events": total_events or 0,
        "successful_logins_24h": logins_today[0] or 0,
        "failed_logins_24h": logins_today[1] or 0,
        "activities_created_7d": activities_this_week or 0,
        # Novos KPIs
        "successful_logins_30d": successful_logins_30d or 0,
        "active_users_30d": active_users_30d or 0
    })

@admin_bp.route('/analytics/creation_steps', methods=['GET'])
@jwt_required()
def get_creation_steps_analytics():
    if not check_admin():
        return jsonify({"message": "Acesso negado."}), 403

    # Mapeamento de números para nomes das etapas
    step_names = {
        '1': 'Cenário Atual',
        '2': 'Cenário Desejado', 
        '3': 'Planejamento',
        '4': 'Perfil do Jogador',
        '5': 'Elementos de Jogo',
        '6': 'Recompensas',
        '7': 'Ações Recompensadas',
        '8': 'Regras e Compartilhamento'
    }

    # Consulta para tempo médio por etapa
    step_duration_data = db.session.query(
        EventLog.details['step'].astext.label('step'),
        func.avg(cast(EventLog.details['duration_seconds'].astext, Numeric)).label('avg_duration'),
        func.count(EventLog.id).label('event_count')
    ).filter(
        EventLog.action == 'step_view_duration',
        EventLog.details['duration_seconds'].isnot(None),
        EventLog.details['step'].isnot(None)
    ).group_by(
        EventLog.details['step'].astext
    ).all()

    # Consulta para abandonos por etapa
    step_abandon_data = db.session.query(
        EventLog.details['last_step'].astext.label('step'),
        func.count(EventLog.id).label('abandon_count')
    ).filter(
        EventLog.action == 'form_abandoned',
        EventLog.details['last_step'].isnot(None)
    ).group_by(
        EventLog.details['last_step'].astext
    ).all()

    # Consulta para cliques de ajuda por etapa
    help_clicks_data = db.session.query(
        EventLog.details['step'].astext.label('step'),
        func.count(EventLog.id).label('help_count')
    ).filter(
        EventLog.action == 'help_button_click',
        EventLog.details['step'].isnot(None)
    ).group_by(
        EventLog.details['step'].astext
    ).all()

    # Transformar os resultados em dicionários
    duration_dict = {str(row.step): {'avg_duration': float(row.avg_duration or 0), 'event_count': row.event_count} for row in step_duration_data}
    abandon_dict = {str(row.step): row.abandon_count or 0 for row in step_abandon_data}
    help_dict = {str(row.step): row.help_count or 0 for row in help_clicks_data}

    # Juntar todos os steps que aparecem em qualquer consulta
    all_steps = set(duration_dict.keys()) | set(abandon_dict.keys()) | set(help_dict.keys())
    
    # Ordenar os steps numericamente
    sorted_steps = sorted(all_steps, key=lambda x: int(x))
    
    # Construir o resultado apenas com steps que têm dados
    result = []
    for step in sorted_steps:
        duration_info = duration_dict.get(step, {'avg_duration': 0, 'event_count': 0})
        result.append({
            'step': step,
            'step_name': step_names.get(step, f'Etapa {step}'),
            'avg_duration': duration_info['avg_duration'],
            'event_count': duration_info['event_count'],
            'abandon_count': abandon_dict.get(step, 0),
            'help_count': help_dict.get(step, 0)
        })

    return jsonify(result)

@admin_bp.route('/analytics/student_engagement', methods=['GET'])
@jwt_required()
def get_student_engagement_data():
    if not check_admin():
        return jsonify({"message": "Acesso negado."}), 403

    # 1. Gráfico: Elementos de Jogo Mais Utilizados
    element_usage_results = db.session.query(
        EventLog.action,
        func.count(EventLog.id)
    ).filter(
        
        EventLog.action.in_([
            'quiz_complete', 
            'roulette_spin_attempt', 
            'slot_machine_attempt',
            'narrative_completed',
            'purchase_item'
        ])
    ).group_by(EventLog.action).all()
    
    # Mapeamento expandido para nomes amigáveis
    element_usage_map = {
        'quiz_complete': 'Quizzes Finalizados',
        'roulette_spin_attempt': 'Roleta (Tentativas)',
        'slot_machine_attempt': 'Caça-níquel (Tentativas)',
        'narrative_completed': 'Narrativas Concluídas',
        'purchase_item': 'Compras na Loja'
    }
    game_element_usage = [{'name': element_usage_map.get(row[0], row[0]), 'count': row[1]} for row in element_usage_results]

    # 2. Gráfico: Itens Mais Comprados na Loja
    top_store_items_results = db.session.query(
        Purchase.item_name,
        func.count(Purchase.id)
    ).group_by(Purchase.item_name).order_by(func.count(Purchase.id).desc()).limit(10).all()
    top_store_items = [{'name': row[0], 'count': row[1]} for row in top_store_items_results]

    # 3. Gráfico: Atividades com Maior Engajamento (soma de durações)
    most_engaging_activities_results = db.session.query(
        Activity.title,
        func.sum(cast(EventLog.details['duration_seconds'].astext, Numeric))
    ).join(Activity, Activity.id == EventLog.activity_id).filter(
        EventLog.action == 'step_view_duration',
        EventLog.details['duration_seconds'].isnot(None)
    ).group_by(Activity.title).order_by(func.sum(cast(EventLog.details['duration_seconds'].astext, Numeric)).desc()).limit(10).all()
    
    most_engaging_activities = [{'title': row[0], 'total_seconds': float(row[1] or 0)} for row in most_engaging_activities_results]

    # 4. KPIs: Saúde da Economia Interna
    coins_earned = db.session.query(func.sum(ActivityProgress.coins)).scalar() or 0
    coins_spent = db.session.query(func.sum(Purchase.price_paid)).scalar() or 0
    economy_kpis = {'coins_earned': coins_earned, 'coins_spent': coins_spent}

    # 5. Gráfico: Funil de Progresso do Aluno
    progress_status_results = db.session.query(
        ActivityProgress.status,
        func.count(ActivityProgress.id)
    ).group_by(ActivityProgress.status).all()
    progress_status = [{'status': row[0], 'count': row[1]} for row in progress_status_results]
    
    # Consolida tudo em um único objeto de resposta
    return jsonify({
        "game_element_usage": game_element_usage,
        "top_store_items": top_store_items,
        "most_engaging_activities": most_engaging_activities,
        "economy_kpis": economy_kpis,
        "progress_status": progress_status,
    })

@admin_bp.route('/analytics/user-locations', methods=['GET'])
@jwt_required()
def get_user_locations():
    if not check_admin():
        return jsonify({"message": "Acesso negado."}), 403

    # Busca todos os usuários que já tiveram a localização registrada
    users_with_location = User.query.filter(
        User.last_known_latitude.isnot(None),
        User.last_known_longitude.isnot(None)
    ).all()

    locations_data = []
    # Usaremos um cache simples para não chamar a API para a mesma coordenada várias vezes
    geo_cache = {}

    for user in users_with_location:
        lat = user.last_known_latitude
        lon = user.last_known_longitude
        cache_key = f"{lat:.4f},{lon:.4f}" # Chave de cache com 4 casas decimais

        if cache_key in geo_cache:
            address = geo_cache[cache_key]
        else:
            try:
                geo_url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
                headers = {'User-Agent': 'GamificaEduPortal/1.0'}
                geo_res = requests.get(geo_url, headers=headers, timeout=5)
                geo_res.raise_for_status()
                geo_data = geo_res.json().get('address', {})
                
                address = {
                    'city': geo_data.get('city') or geo_data.get('town') or geo_data.get('village', 'N/A'),
                    'state': geo_data.get('state', 'N/A'),
                    'country': geo_data.get('country', 'N/A'),
                    'suburb': geo_data.get('suburb', 'N/A') # Bairro/Subúrbio
                }
                geo_cache[cache_key] = address # Salva no cache

            except requests.exceptions.RequestException as e:
                current_app.logger.error(f"Falha na geocodificação para user {user.id}: {e}")
                address = None
        
        if address:
            locations_data.append({
                "user_id": user.id,
                "user_name": user.name,
                "latitude": lat,
                "longitude": lon,
                "city": address.get('city'),
                "state": address.get('state'),
                "country": address.get('country'),
                "suburb": address.get('suburb'),
                "last_update": user.last_location_update.isoformat() if user.last_location_update else 'N/A'
            })
            
    return jsonify(locations_data)
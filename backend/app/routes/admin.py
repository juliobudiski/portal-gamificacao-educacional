# backend/app/routes/admin.py
from flask_cors import cross_origin 
from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, User, Activity, EventLog
from sqlalchemy import func, case
from datetime import datetime, timedelta
from collections import Counter
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

    activities_with_professors = db.session.query(
        Activity, User.name.label('professor_name')
    ).join(User, User.id == Activity.professor_id).all()
    
    activities_list = []
    for activity, professor_name in activities_with_professors:
        act_dict = activity.to_dict()
        act_dict['professor_name'] = professor_name
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

    return jsonify({
        "total_events": total_events or 0,
        "successful_logins_24h": logins_today[0] or 0,
        "failed_logins_24h": logins_today[1] or 0,
        "activities_created_7d": activities_this_week or 0
    })

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

    # Parâmetros de paginação e filtro
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 15, type=int)
    search_user = request.args.get('user', None, type=str)
    filter_action = request.args.get('action', None, type=str)
    
    query = db.session.query(EventLog, User.name, User.email).join(User, User.id == EventLog.user_id)

    # Aplica filtros se fornecidos
    if search_user:
        query = query.filter(User.name.ilike(f'%{search_user}%'))
    if filter_action:
        query = query.filter(EventLog.action == filter_action)
    
    # Ordena pelos mais recentes
    query = query.order_by(EventLog.created_at.desc())
    
    # Paginação
    paginated_logs = query.paginate(page=page, per_page=per_page, error_out=False)
    
    logs_data = []
    for log, user_name, user_email in paginated_logs.items:
        logs_data.append({
            "id": log.id,
            "user_name": user_name,
            "user_email": user_email,
            "action": log.action,
            "section": log.section,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": log.created_at.isoformat()
        })
        
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
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403

    activities = Activity.query.all()
    if not activities:
        return jsonify({
            "game_elements": [], "player_profiles": [],
            "rewarded_actions": [], "rewards_offered": []
        })

    # Usando collections.Counter para agregar os dados de forma eficiente
    game_elements_counter = Counter()
    player_profiles_counter = Counter()
    rewarded_actions_counter = Counter()
    rewards_offered_counter = Counter()

    for activity in activities:
        if activity.game_elements and 'selectedElements' in activity.game_elements:
            game_elements_counter.update(activity.game_elements['selectedElements'])
        if activity.player_profile and 'selectedProfiles' in activity.player_profile:
            player_profiles_counter.update(activity.player_profile['selectedProfiles'])
        if activity.rewarded_actions and 'selectedActions' in activity.rewarded_actions:
            rewarded_actions_counter.update(activity.rewarded_actions['selectedActions'])
        if activity.rewards_offered and 'selectedRewards' in activity.rewards_offered:
            rewards_offered_counter.update(activity.rewards_offered['selectedRewards'])
            
    # Função auxiliar para formatar os dados para os gráficos
    def format_counter_data(counter, name_key='name', value_key='count'):
        return [{name_key: item, value_key: count} for item, count in counter.most_common(10)]

    return jsonify({
        "game_elements": format_counter_data(game_elements_counter, 'element', 'count'),
        "player_profiles": format_counter_data(player_profiles_counter, 'profile', 'count'),
        "rewarded_actions": format_counter_data(rewarded_actions_counter, 'action', 'count'),
        "rewards_offered": format_counter_data(rewards_offered_counter, 'reward', 'count')
    })

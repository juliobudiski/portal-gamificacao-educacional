"""
Módulo de Rotas do Painel Administrativo (Admin)
Responsável por fornecer todos os dados analíticos (KPIs, gráficos, logs) 
para a visão geral do sistema, gerenciar usuários, gerenciar mensagens de contato,
e permitir a moderação global da plataforma por administradores.
"""
# backend/app/routes/admin.py
from flask_cors import cross_origin 
from flask import Blueprint, jsonify, current_app, request, Response
import csv
from io import StringIO
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from ..models import db, User, Activity, EventLog, Purchase, ActivityProgress, ContactMessage, StudentResponse, RouletteWin, SlotWin, ForumTopic, ForumPost, Class, Enrollment
from sqlalchemy import func, case, cast, Numeric
from datetime import datetime, timedelta
from collections import Counter
import requests
import os
from ..models import ContactMessage
from ..services.admin_service import AdminService
from ..utils.email_sender import send_teacher_code_email

admin_bp = Blueprint('admin', __name__)

# Função auxiliar para verificar se o usuário é admin
def check_admin():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user and user.role == 'admin'

# ==============================================================================
# ROTAS DE DASHBOARD E KPIS GERAIS
# ==============================================================================
# Rota para dados dos cards (KPIs)
@admin_bp.route('/dashboard_data', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    """
    Retorna os KPIs básicos para os cards superiores do painel de administração
    (Total de usuários, professores, alunos e atividades criadas).
    - Acesso: Apenas Administradores.
    """
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

@admin_bp.route('/analytics/activity-status', methods=['GET'])
@jwt_required()
def get_activity_status_stats():
    """
    Calcula a distribuição do status das atividades no sistema 
    (Não iniciadas, Em Andamento e Concluídas) baseada nas matrículas e no ActivityProgress.
    """
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403
    
    total_classes = Class.query.count()
    activities = Activity.query.filter(Activity.class_id.isnot(None)).all()
    total_activities = len(activities)
    
    not_started = 0
    in_progress = 0
    completed = 0
    
    for activity in activities:
        enrollments = Enrollment.query.filter_by(class_id=activity.class_id).all()
        if not enrollments:
            not_started += 1
            continue
            
        student_ids = [e.student_id for e in enrollments]
        progress_records = ActivityProgress.query.filter(
            ActivityProgress.activity_id == activity.id,
            ActivityProgress.student_id.in_(student_ids)
        ).all()
        
        if not progress_records:
            not_started += 1
        else:
            all_completed = True
            any_progress = False
            for p in progress_records:
                if p.status == 'completed':
                    any_progress = True
                elif p.status == 'in_progress':
                    any_progress = True
                    all_completed = False
                elif p.status == 'not_started':
                    all_completed = False
                    
            if len(progress_records) < len(student_ids):
                all_completed = False
                
            if all_completed:
                completed += 1
            elif any_progress:
                in_progress += 1
            else:
                not_started += 1
                
    return jsonify({
        "total_classes": total_classes,
        "total_activities": total_activities,
        "not_started": not_started,
        "in_progress": in_progress,
        "completed": completed
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
    
    # Removemos os eventos de navegação barulhentos para focar no que importa
    noisy_events = ['view_start', 'view_duration', 'step_view_duration', 'stepper_navigation']
    
    distribution = db.session.query(
        EventLog.action,
        func.count(EventLog.id).label('count')
    ).filter(
        ~EventLog.action.in_(noisy_events) # Filtra o barulho
    ).group_by(EventLog.action).order_by(func.count(EventLog.id).desc()).limit(10).all()
    
    # Limpa o texto (Ex: 'activity_created' vira 'Activity Created')
    chart_data = [{"action": row.action.replace('_', ' ').title(), "count": row.count} for row in distribution]
    return jsonify(chart_data)


@admin_bp.route('/analytics/logs', methods=['GET'])
@jwt_required()
def get_system_logs():
    """
    Fornece a visualização tabular dos logs do sistema (EventLog), 
    com suporte à paginação e filtragem por usuário, ação e datas.
    """
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 15, type=int)
    search_user = request.args.get('user', None, type=str)
    filter_action = request.args.get('action', None, type=str)
    start_date_str = request.args.get('startDate', None)
    end_date_str = request.args.get('endDate', None)
    query = db.session.query(
        EventLog, 
        User.name, 
        User.email, 
        User.cached_city,   # Lendo direto do banco! Zero delay.
        User.cached_state,
        User.cached_country
    ).join(User, User.id == EventLog.user_id)

    if search_user:
        query = query.filter(User.name.ilike(f'%{search_user}%'))
    if filter_action:
        query = query.filter(EventLog.action == filter_action)
    
    # Filtro de Data (YYYY-MM-DD)
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            query = query.filter(EventLog.created_at >= start_date)
        except ValueError:
            pass # Ignora data inválida
            
    if end_date_str:
        try:
            # Ajusta para o final do dia (23:59:59)
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(EventLog.created_at < end_date)
        except ValueError:
            pass
    
    query = query.order_by(EventLog.created_at.desc())
    
    paginated_logs = query.paginate(page=page, per_page=per_page, error_out=False)
    
    logs_data = []
    # --- LÓGICA DE GEOLOCALIZAÇÃO CORRIGIDA ---
    for log, user_name, user_email, city, state, country in paginated_logs.items:
        log_data = {
            "id": log.id,
            "user_name": user_name,
            "user_email": user_email,
            "action": log.action,
            "section": log.section,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": log.created_at.isoformat(),
            "location": {
                'city': city or 'N/A',
                'state': state or 'N/A',
                'country': country or 'Brasil' # Fallback seguro
            } if city else None
        }
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

    # 1. Gráfico: Elementos de Jogo Mais Utilizados (BUSCANDO DA FONTE DE VERDADE)
    quiz_count = db.session.query(func.count(StudentResponse.id)).scalar() or 0
    roulette_count = db.session.query(func.count(RouletteWin.id)).scalar() or 0
    slot_count = db.session.query(func.count(SlotWin.id)).scalar() or 0
    purchase_count = db.session.query(func.count(Purchase.id)).scalar() or 0
    forum_topics = db.session.query(func.count(ForumTopic.id)).scalar() or 0
    forum_posts = db.session.query(func.count(ForumPost.id)).scalar() or 0
    
    game_element_usage = [
        {'name': 'Quizzes (Respostas)', 'count': quiz_count},
        {'name': 'Fórum (Interações)', 'count': forum_topics + forum_posts},
        {'name': 'Roleta (Vitórias)', 'count': roulette_count},
        {'name': 'Caça-Níquel (Vitórias)', 'count': slot_count},
        {'name': 'Loja (Compras)', 'count': purchase_count},
    ]
    # Filtra as que estão zeradas para o gráfico não ficar feio
    #game_element_usage = [g for g in game_element_usage if g['count'] > 0]

    # 2. Gráfico: Itens Mais Comprados na Loja
    top_store_items_results = db.session.query(
        Purchase.item_name,
        func.count(Purchase.id)
    ).group_by(Purchase.item_name).order_by(func.count(Purchase.id).desc()).limit(10).all()
    top_store_items = [{'name': row[0], 'count': row[1]} for row in top_store_items_results]

    # 3. Gráfico: Atividades com Maior Engajamento (Duração)
    most_engaging_activities_results = db.session.query(
        Activity.title,
        func.sum(cast(EventLog.details['duration_seconds'].astext, Numeric))
    ).join(Activity, Activity.id == EventLog.activity_id).filter(
        EventLog.action == 'step_view_duration',
        EventLog.details['duration_seconds'].isnot(None)
    ).group_by(Activity.title).order_by(func.sum(cast(EventLog.details['duration_seconds'].astext, Numeric)).desc()).limit(10).all()
    
    most_engaging_activities = [{'title': row[0], 'total_seconds': float(row[1] or 0)} for row in most_engaging_activities_results]

    # 4. KPIs: Saúde da Economia Interna (CORRIGIDO)
    coins_balance = db.session.query(func.sum(ActivityProgress.coins)).scalar() or 0
    coins_spent = db.session.query(func.sum(Purchase.price_paid)).scalar() or 0
    
    # As moedas GERAIS = O que sobrou na carteira dos alunos + O que eles já gastaram
    total_coins_earned = int(coins_balance) + int(coins_spent)
    
    economy_kpis = {
        'coins_earned': total_coins_earned, 
        'coins_spent': int(coins_spent),
        'coins_balance': int(coins_balance)
    }

    # 5. Gráfico: Funil de Progresso do Aluno
    progress_status_results = db.session.query(
        ActivityProgress.status,
        func.count(ActivityProgress.id)
    ).group_by(ActivityProgress.status).all()
    
    status_map = {
        'in_progress': 'Em Andamento',
        'completed': 'Concluído',
        'not_started': 'Não Iniciado'
    }
    progress_status = [{'status': status_map.get(row[0], row[0]), 'count': row[1]} for row in progress_status_results]
    
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

    locations_data = AdminService.get_user_locations_data()
    return jsonify(locations_data)

@admin_bp.route('/contact/messages', methods=['GET'])
@jwt_required()
def get_contact_messages():
    if not check_admin():
        return jsonify({"message": "Acesso negado."}), 403

    # Busca mensagens ordenadas: Não lidas primeiro, depois as mais recentes
    messages = ContactMessage.query.order_by(
        ContactMessage.is_read.asc(),
        ContactMessage.created_at.desc()
    ).limit(100).all() # Limitando a 100 para segurança inicial, ideal é paginar

    return jsonify([msg.to_dict() for msg in messages])

@admin_bp.route('/contact/messages/<int:msg_id>/read', methods=['PATCH'])
@jwt_required()
def mark_contact_message_read(msg_id):
    if not check_admin():
        return jsonify({"message": "Acesso negado."}), 403

    msg = ContactMessage.query.get_or_404(msg_id)
    msg.is_read = True
    db.session.commit()
    
    return jsonify({"success": True, "message": "Mensagem marcada como lida"})

@admin_bp.route('/contact/messages/<int:msg_id>/send_code', methods=['POST'])
@jwt_required()
def send_access_code_email(msg_id):
    if not check_admin():
        return jsonify({"message": "Acesso negado."}), 403

    msg = ContactMessage.query.get_or_404(msg_id)
    
    if not msg.email:
        return jsonify({"message": "Esta mensagem não possui um e-mail válido para resposta."}), 400

    access_code = os.environ.get('TEACHER_ACCESS_CODE', 'GAMIFICA_PROF_2026')
    name = msg.name or 'Professor(a)'

    success = send_teacher_code_email(msg.email, access_code, name)
    if success:
        return jsonify({"success": True, "message": "Código enviado com sucesso!"})
    else:
        return jsonify({"success": False, "message": "Falha ao enviar e-mail. Verifique os logs."}), 500

@admin_bp.route('/analytics/logs/export', methods=['GET'])
@jwt_required()
def export_logs_csv():
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403

    search_user = request.args.get('user', None, type=str)
    filter_action = request.args.get('action', None, type=str)
    start_date_str = request.args.get('startDate', None)
    end_date_str = request.args.get('endDate', None)
    
    generator = AdminService.generate_csv_logs(search_user, filter_action, start_date_str, end_date_str)
    
    response = Response(generator, mimetype='text/csv')
    response.headers.set("Content-Disposition", "attachment", filename="gamefica_logs_export.csv")
    return response

# --- ROTAS DE GERENCIAMENTO DE USUÁRIOS E ATIVIDADES ---

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403
    
    user_to_edit = User.query.get_or_404(user_id)
    data = request.json
    
    if 'name' in data: user_to_edit.name = data['name']
    if 'email' in data: user_to_edit.email = data['email']
    if 'password' in data and data['password'].strip():
        user_to_edit.password_hash = generate_password_hash(data['password'].strip())
    if 'role' in data:
        if data['role'] in ['aluno', 'professor', 'admin']:
            user_to_edit.role = data['role']
    
    try:
        db.session.commit()
        return jsonify({"success": True, "message": "Usuário atualizado com sucesso."})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Erro ao atualizar usuário: {str(e)}"}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403
    
    user_to_delete = User.query.get_or_404(user_id)
    
    if user_to_delete.id == get_jwt_identity():
        return jsonify({"success": False, "message": "Você não pode deletar a si mesmo."}), 400

    try:
        # Como o banco não tem cascade all completo configurado no User, a exclusão pode falhar 
        # se houver dependências não tratadas. Uma abordagem manual simplificada para EventLogs:
        EventLog.query.filter_by(user_id=user_to_delete.id).delete()
        
        db.session.delete(user_to_delete)
        db.session.commit()
        return jsonify({"success": True, "message": "Usuário deletado com sucesso."})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Erro ao deletar usuário. Pode haver registros dependentes. Detalhes: {str(e)}"}), 500

@admin_bp.route('/activities/<int:activity_id>/visibility', methods=['PATCH'])
@jwt_required()
def toggle_activity_visibility(activity_id):
    """
    [Arquitetura]
    Por que: Regras de negócio sobre visibilidade e persistência devem morar no Service.
    O Controller Admin deve apenas checar permissões de acesso (check_admin).
    """
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403
    return AdminService.toggle_activity_visibility(activity_id)

@admin_bp.route('/activities/mass', methods=['DELETE'])
@jwt_required()
def delete_activities_mass():
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403
    
    data = request.get_json()
    activity_ids = data.get('activity_ids', [])
    
    if not activity_ids or not isinstance(activity_ids, list):
        return jsonify({"message": "Lista de IDs inválida."}), 400
        
    try:
        from ..models import Conversation, ChatMessage, ActivityRating, Purchase, StoreItem, SlotWin, RouletteWin, StudentResponse, QuizContent, NarrativeContent, UserUnlockedTitle, ActivityProgress, EventLog, ActivityRevision, UserUnlockedMedal, LearningContent
        
        # Limpar items da loja para remover dependências (equipados)
        item_ids = [item.id for item in StoreItem.query.filter(StoreItem.activity_id.in_(activity_ids)).all()]
        if item_ids:
            ActivityProgress.query.filter(ActivityProgress.equipped_name_cosmetic_id.in_(item_ids)).update({'equipped_name_cosmetic_id': None}, synchronize_session=False)
            ActivityProgress.query.filter(ActivityProgress.equipped_title_cosmetic_id.in_(item_ids)).update({'equipped_title_cosmetic_id': None}, synchronize_session=False)
        
        # Limpar conversas (fórum)
        conversations = Conversation.query.filter(Conversation.activity_id.in_(activity_ids)).all()
        if conversations:
            conv_ids = [c.id for c in conversations]
            ChatMessage.query.filter(ChatMessage.conversation_id.in_(conv_ids)).delete(synchronize_session=False)
            Conversation.query.filter(Conversation.id.in_(conv_ids)).delete(synchronize_session=False)

        # Deletar dependências diretas
        ActivityRating.query.filter(ActivityRating.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        Purchase.query.filter(Purchase.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        StoreItem.query.filter(StoreItem.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        SlotWin.query.filter(SlotWin.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        RouletteWin.query.filter(RouletteWin.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        StudentResponse.query.filter(StudentResponse.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        QuizContent.query.filter(QuizContent.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        NarrativeContent.query.filter(NarrativeContent.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        LearningContent.query.filter(LearningContent.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        UserUnlockedTitle.query.filter(UserUnlockedTitle.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        ActivityProgress.query.filter(ActivityProgress.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        EventLog.query.filter(EventLog.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        ActivityRevision.query.filter(ActivityRevision.activity_id.in_(activity_ids)).delete(synchronize_session=False)
        UserUnlockedMedal.query.filter(UserUnlockedMedal.activity_id.in_(activity_ids)).delete(synchronize_session=False)

        Activity.query.filter(Activity.id.in_(activity_ids)).delete(synchronize_session=False)
        db.session.commit()
        return jsonify({"success": True, "message": f"{len(activity_ids)} atividades deletadas com sucesso."})
    except Exception as e:
        db.session.rollback()
        import traceback
        logger.error(f"[delete_activities_mass] Erro crítico ao deletar em massa: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"message": f"Erro interno ao deletar atividades em massa: {str(e)}"}), 500

@admin_bp.route('/activities/<int:activity_id>', methods=['DELETE'])
@jwt_required()
def delete_activity(activity_id):
    if not check_admin(): return jsonify({"message": "Acesso negado."}), 403
    
    activity = Activity.query.get_or_404(activity_id)
    
    try:
        from ..models import Conversation, ChatMessage, ActivityRating, Purchase, StoreItem, SlotWin, RouletteWin, StudentResponse, QuizContent, NarrativeContent, UserUnlockedTitle, ActivityProgress, EventLog, ActivityRevision, UserUnlockedMedal, LearningContent
        
        # Limpar items da loja para remover dependências (equipados)
        item_ids = [item.id for item in StoreItem.query.filter_by(activity_id=activity_id).all()]
        if item_ids:
            ActivityProgress.query.filter(ActivityProgress.equipped_name_cosmetic_id.in_(item_ids)).update({'equipped_name_cosmetic_id': None}, synchronize_session=False)
            ActivityProgress.query.filter(ActivityProgress.equipped_title_cosmetic_id.in_(item_ids)).update({'equipped_title_cosmetic_id': None}, synchronize_session=False)
        
        # Limpar conversas (fórum)
        conversations = Conversation.query.filter_by(activity_id=activity_id).all()
        if conversations:
            conv_ids = [c.id for c in conversations]
            ChatMessage.query.filter(ChatMessage.conversation_id.in_(conv_ids)).delete(synchronize_session=False)
            Conversation.query.filter(Conversation.id.in_(conv_ids)).delete(synchronize_session=False)

        # Deletar dependências diretas
        ActivityRating.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        Purchase.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        StoreItem.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        SlotWin.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        RouletteWin.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        StudentResponse.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        QuizContent.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        NarrativeContent.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        LearningContent.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        UserUnlockedTitle.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        ActivityProgress.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        EventLog.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        ActivityRevision.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)
        UserUnlockedMedal.query.filter_by(activity_id=activity_id).delete(synchronize_session=False)

        db.session.delete(activity)
        db.session.commit()
        return jsonify({"success": True, "message": "Atividade deletada com sucesso."})
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Erro ao deletar atividade: {str(e)}"}), 500
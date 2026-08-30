"""
Módulo de Rotas do Fórum (Forum)
Responsável por gerenciar as interações dos usuários no fórum de dúvidas
da atividade (tópicos, posts/respostas, likes, e moderação de vocabulário).
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..models import db, ForumTopic, ForumPost, User, Activity, ForumCategory, TopicLike, PostLike
from sqlalchemy import case
from ..utils.text_sanitizer import clean_text, censor_text
from ..services.forum_service import ForumService

forum_bp = Blueprint('forum', __name__)

@forum_bp.route('/activity/<int:activity_id>/categories', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_forum_categories(activity_id):
    """
    Lista todas as categorias do fórum para uma atividade, criando-as dinamicamente 
    caso ainda não existam.
    - Acesso: Autenticado.
    - Retorno: Lista de categorias (Dúvidas, Sugestões, Off-Topic, etc).
    """
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200

    categories = ForumCategory.query.filter_by(activity_id=activity_id).all()
    if not categories:
        ForumService.create_default_categories(activity_id)
        categories = ForumCategory.query.filter_by(activity_id=activity_id).all()
        
    return jsonify([category.to_dict() for category in categories]), 200

@forum_bp.route('/category/<int:category_id>/topics', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_category_topics(category_id):
    """
    Lista todos os tópicos abertos dentro de uma categoria específica.
    - Ordenação: Do mais recente para o mais antigo.
    - Retorno: Lista de Tópicos.
    """
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200

    category = ForumCategory.query.get_or_404(category_id)
    topics = ForumTopic.query.filter_by(category_id=category_id).order_by(ForumTopic.created_at.desc()).all()
    
    topics_list = [topic.to_dict() for topic in topics]
    enriched_topics = _enrich_forum_with_cosmetics(topics_list, category.activity_id)
    
    return jsonify(enriched_topics), 200

# --- CRIAÇÃO DE TÓPICO (COM FILTRO) ---
@forum_bp.route('/category/<int:category_id>/topics', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_topic_in_category(category_id):
    """
    Cria um novo tópico de fórum dentro de uma categoria.
    Aplica filtros de sanitização (WAF, Anti-XSS, Palavrões) através do ForumService.
    - Payload JSON esperado: { "title": "str", "body": "str" }
    - Retorno: Dados do novo tópico criado.
    """
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200
    user_id = get_jwt_identity()
    data = request.get_json()

    raw_title = data.get('title', '')
    raw_body = data.get('body', '')
    
    result, error, status = ForumService.create_topic_with_moderation(category_id, user_id, raw_title, raw_body)
    
    if error:
        return jsonify(error), status
        
    return jsonify(result), status

# --- ROTA DETALHES DO TÓPICO ---
@forum_bp.route('/topics/<int:topic_id>', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_topic_details(topic_id):
    """
    Obtém os detalhes completos de um tópico, incluindo todas as suas respostas.
    Aplica regras de ordenação: a "Melhor Resposta" sempre aparece no topo.
    Também identifica se o usuário que está lendo curtiu cada post.
    """
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200
    user_id = get_jwt_identity() # --- ADICIONE ESTA LINHA ---
    
    topic = ForumTopic.query.get_or_404(topic_id)
    # Define a ordenação: melhor resposta em primeiro lugar (0), as demais em seguida (1) por ordem cronológica.
    best_answer_first = case((ForumPost.id == topic.best_answer_id, 0), else_=1)
    posts_query = topic.posts.order_by(best_answer_first, ForumPost.created_at.asc())

    # --- MODIFIQUE ESTE BLOCO ---
    posts = []
    for post in posts_query.all():
        post_dict = post.to_dict()
        # Verifica se o usuário atual curtiu este post para colorir o botão de 'Like' no frontend
        post_dict['current_user_has_liked'] = PostLike.query.filter_by(user_id=user_id, post_id=post.id).first() is not None
        posts.append(post_dict)
        
    enriched_posts = _enrich_forum_with_cosmetics(posts, topic.category.activity_id)

    topic_details = topic.to_dict()
    # Verifica se o usuário atual curtiu o tópico principal (se necessário)
    topic_details['current_user_has_liked'] = TopicLike.query.filter_by(user_id=user_id, topic_id=topic.id).first() is not None
    
    # Enriquecer o próprio tópico também
    enriched_topic = _enrich_forum_with_cosmetics([topic_details], topic.category.activity_id)[0]
    
    enriched_topic['posts'] = enriched_posts
    # --- FIM DA MODIFICAÇÃO ---
    
    return jsonify(enriched_topic), 200

# --- CRIAÇÃO DE POST (RESPOSTA) (COM FILTRO) ---
@forum_bp.route('/topics/<int:topic_id>/posts', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_post(topic_id):
    """
    Adiciona uma nova resposta a um tópico existente.
    Aplica filtros de sanitização (WAF, Anti-XSS, Palavrões) através do ForumService.
    - Payload JSON esperado: { "body": "str" }
    """
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200
    user_id = get_jwt_identity()
    data = request.get_json()
    raw_body = data.get('body', '')
    
    result, error, status = ForumService.create_post_with_moderation(topic_id, user_id, raw_body)
    
    if error:
        return jsonify(error), status
        
    return jsonify(result), status

# --- ROTA PARA A AÇÃO DE MARCAR A MELHOR RESPOSTA ---

@forum_bp.route('/topics/<int:topic_id>/best-answer', methods=['PUT', 'OPTIONS'])
@jwt_required()
def set_best_answer(topic_id):
    """
    Define (ou remove) uma resposta como a "Melhor Resposta" do tópico.
    Apenas o próprio autor do tópico possui permissão para executar esta ação.
    - Payload JSON esperado: { "post_id": int_or_null }
    """
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200
    user_id = get_jwt_identity()
    data = request.get_json()
    post_id = data.get('post_id')
    topic = ForumTopic.query.get_or_404(topic_id)
    
    # Validação de Autoridade
    if int(topic.author_id) != int(user_id):
        return jsonify({"message": "Apenas o autor do tópico pode marcar a melhor resposta."}), 403
        
    # Se enviar None ou vazio, "desmarca" a melhor resposta atual
    if post_id is None:
        topic.best_answer_id = None
        db.session.commit()
        return jsonify({"message": "Melhor resposta desmarcada."}), 200
        
    post = ForumPost.query.get_or_404(post_id)
    # Garante que a resposta pertence a este tópico específico
    if post.topic_id != topic.id:
        return jsonify({"message": "Esta resposta não pertence a este tópico."}), 400
        
    topic.best_answer_id = post.id
    db.session.commit()
    return jsonify({"message": "Melhor resposta definida com sucesso!", "best_answer_id": post.id}), 200

@forum_bp.route('/posts/<int:post_id>/like', methods=['POST', 'OPTIONS'])
@jwt_required()
def toggle_post_like(post_id):
    """
    Adiciona ou remove (toggle) a curtida de um usuário em uma resposta do fórum.
    """
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200
    user_id = get_jwt_identity()

    # Verifica se já existe um like deste usuário nesta resposta
    existing_like = PostLike.query.filter_by(user_id=user_id, post_id=post_id).first()

    if existing_like:
        # Se existe, remove (descurtir)
        db.session.delete(existing_like)
        db.session.commit()
        return jsonify({"message": "Like removido.", "liked": False}), 200
    else:
        # Se não existe, adiciona (curtir)
        if not ForumPost.query.get(post_id):
            return jsonify({"message": "Post não encontrado."}), 404
        new_like = PostLike(user_id=user_id, post_id=post_id)
        db.session.add(new_like)
        db.session.commit()
        return jsonify({"message": "Like adicionado.", "liked": True}), 201# Temporary file to inject the logic
import json
from ..models import db, ActivityProgress, User

def _enrich_forum_with_cosmetics(items_dicts, activity_id):
    if not items_dicts:
        return items_dicts

    author_ids = list(set(item['author_id'] for item in items_dicts if 'author_id' in item))
    if not author_ids:
        return items_dicts
        
    progress_records = ActivityProgress.query.filter(
        ActivityProgress.activity_id == activity_id,
        ActivityProgress.student_id.in_(author_ids)
    ).all()
    
    users = User.query.filter(User.id.in_(author_ids)).all()
    user_avatars = {u.id: u.profile_picture for u in users}

    cosmetic_map = {}
    for p in progress_records:
        name_cosmetic = p.equipped_name_cosmetic.effect_id if p.equipped_name_cosmetic else None
        title_cosmetic = p.equipped_title_cosmetic.effect_id if p.equipped_title_cosmetic else None
        
        if isinstance(name_cosmetic, str):
            try: name_cosmetic = json.loads(name_cosmetic)
            except: pass
        if isinstance(title_cosmetic, str):
            try: title_cosmetic = json.loads(title_cosmetic)
            except: pass

        cosmetic_map[p.student_id] = {
            "title": p.equipped_title.display_text if p.equipped_title else None,
            "name_cosmetic": name_cosmetic,
            "title_cosmetic": title_cosmetic,
            "avatar": p.equipped_activity_avatar_url or user_avatars.get(p.student_id) or '/avatars/default_avatar.webp'
        }
        
    for item in items_dicts:
        c = cosmetic_map.get(item.get('author_id'), {})
        item['title'] = c.get('title')
        item['name_cosmetic'] = c.get('name_cosmetic')
        item['title_cosmetic'] = c.get('title_cosmetic')
        item['avatar'] = c.get('avatar', user_avatars.get(item.get('author_id'), '/avatars/default_avatar.webp'))
        
    return items_dicts

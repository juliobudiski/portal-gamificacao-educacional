# backend/app/routes/forum.py

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..models import db, ForumTopic, ForumPost, User, Activity, ForumCategory
from sqlalchemy import case

forum_bp = Blueprint('forum', __name__)
# --- FUNÇÃO AUXILIAR PARA CRIAR TÓPICOS PADRÃO ---
def _create_default_categories(activity_id):
    """Cria categorias padrão em vez de tópicos padrão."""
    default_categories = [
        ForumCategory(
            activity_id=activity_id,
            title="Dúvidas Gerais",
            description="Tem alguma pergunta sobre a matéria? Crie um tópico aqui!"
        ),
        ForumCategory(
            activity_id=activity_id,
            title="Sugestões e Feedback",
            description="Ideias para melhorar a atividade? Partilhe aqui."
        )
    ]
    db.session.add_all(default_categories)
    db.session.commit()
    current_app.logger.info(f"Categorias padrão criadas para a atividade ID {activity_id}.")

@forum_bp.route('/activity/<int:activity_id>/categories', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_forum_categories(activity_id):
    """Lista todas as categorias do fórum para uma atividade, criando-as se não existirem."""
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200

    categories = ForumCategory.query.filter_by(activity_id=activity_id).all()
    if not categories:
        _create_default_categories(activity_id)
        categories = ForumCategory.query.filter_by(activity_id=activity_id).all()
        
    return jsonify([category.to_dict() for category in categories]), 200

@forum_bp.route('/category/<int:category_id>/topics', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_category_topics(category_id):
    """Lista todos os tópicos dentro de uma categoria específica."""
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200

    topics = ForumTopic.query.filter_by(category_id=category_id).order_by(ForumTopic.created_at.desc()).all()
    return jsonify([topic.to_dict() for topic in topics]), 200

@forum_bp.route('/category/<int:category_id>/topics', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_topic_in_category(category_id):
    """Cria um novo tópico dentro de uma categoria (qualquer aluno pode criar)."""
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200
    user_id = get_jwt_identity()
    data = request.get_json()

    title = data.get('title')
    body = data.get('body')
    if not title or not body:
        return jsonify({"message": "Título e corpo são obrigatórios."}), 400
    
    new_topic = ForumTopic(
        title=title, 
        body=body, 
        category_id=category_id, 
        author_id=user_id,
        activity_id=ForumCategory.query.get(category_id).activity_id # Garante a consistência
    )
    db.session.add(new_topic)
    db.session.commit()
    return jsonify(new_topic.to_dict()), 201

# --- ROTAS PARA UM TÓPICO ESPECÍFICO E SUAS RESPOSTAS ---

@forum_bp.route('/topics/<int:topic_id>', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_topic_details(topic_id):
    """Obtém os detalhes de um tópico e todas as suas respostas."""
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200
    
    topic = ForumTopic.query.get_or_404(topic_id)

    # --- INÍCIO DA CORREÇÃO DE ORDENAÇÃO ---
    # Cria uma expressão 'case' para a ordenação.
    # Se post.id for igual ao best_answer_id do tópico, ele recebe prioridade 0.
    # Todos os outros recebem prioridade 1.
    best_answer_first = case((ForumPost.id == topic.best_answer_id, 0), else_=1)
    
    # Ordena primeiro pela prioridade (melhor resposta no topo) e depois pela data de criação.
    posts_query = topic.posts.order_by(best_answer_first, ForumPost.created_at.asc())
    # --- FIM DA CORREÇÃO ---

    posts = [post.to_dict() for post in posts_query.all()]
    topic_details = topic.to_dict()
    topic_details['posts'] = posts
    
    return jsonify(topic_details), 200

@forum_bp.route('/topics/<int:topic_id>/posts', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_post(topic_id):
    """Adiciona uma nova resposta a um tópico."""
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200
    user_id = get_jwt_identity()
    data = request.get_json()
    body = data.get('body')
    if not body:
        return jsonify({"message": "O corpo da resposta é obrigatório."}), 400
    topic = ForumTopic.query.get_or_404(topic_id)
    new_post = ForumPost(body=body, topic_id=topic.id, author_id=user_id)
    db.session.add(new_post)
    db.session.commit()
    return jsonify(new_post.to_dict()), 201

# --- ROTA PARA A AÇÃO DE MARCAR A MELHOR RESPOSTA ---

@forum_bp.route('/topics/<int:topic_id>/best-answer', methods=['PUT', 'OPTIONS'])
@jwt_required()
def set_best_answer(topic_id):
    """Define a melhor resposta para um tópico."""
    if request.method == 'OPTIONS': return jsonify({'message': 'CORS preflight'}), 200
    user_id = get_jwt_identity()
    data = request.get_json()
    post_id = data.get('post_id')
    topic = ForumTopic.query.get_or_404(topic_id)
    if topic.author_id != user_id:
        return jsonify({"message": "Apenas o autor do tópico pode marcar a melhor resposta."}), 403
    if post_id is None:
        topic.best_answer_id = None
        db.session.commit()
        return jsonify({"message": "Melhor resposta desmarcada."}), 200
    post = ForumPost.query.get_or_404(post_id)
    if post.topic_id != topic.id:
        return jsonify({"message": "Esta resposta não pertence a este tópico."}), 400
    topic.best_answer_id = post.id
    db.session.commit()
    return jsonify({"message": "Melhor resposta definida com sucesso!", "best_answer_id": post.id}), 200

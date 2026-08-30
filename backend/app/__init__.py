# backend/app/__init__.py

import os
import logging
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from .extensions import socketio, scheduler, db, migrate

def create_app():
    """
    Função 'Application Factory'. Setup inicial e injeção de dependências.
    """
    app = Flask(__name__)

    _configure_app(app)
    _initialize_extensions(app)
    _register_blueprints_and_routes(app)
    _register_cli_commands(app)
    
    return app

def _configure_app(app):
    """Encapsula o carregamento das configurações globais."""
    from .config import Config
    app.config.from_object(Config)
    
    from .utils.logging import configure_logging
    configure_logging(app)
    
    from .utils.auth_utils import configure_jwt
    configure_jwt(app)

def _initialize_extensions(app):
    """Responsável por ligar o app às extensões externas (BD, Sockets, Scheduler)."""
    from app.commands import seed, triggers, simulations, maintenance
    
    db.init_app(app)
    migrate.init_app(app, db)
    maintenance.init_app(app)
    seed.init_app(app)
    triggers.init_app(app)
    simulations.init_app(app)
    
    # Habilita o CORS globalmente
    CORS(app, resources={r"/api/*": {"origins": "*"}}) 
    socketio.init_app(app)
    
    # INICIALIZAÇÃO DO SCHEDULER
    app.config['SCHEDULER_API_ENABLED'] = True 
    scheduler.init_app(app)
    
    # Para evitar que múltiplos workers do Gunicorn rodem o scheduler ao mesmo tempo,
    # verificamos uma variável de ambiente ou apenas rodamos se for Werkzeug main.
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or os.environ.get('RUN_SCHEDULER') == 'true':
        scheduler.start()
        
    # Registra as tarefas
    from .tasks import register_tasks
    register_tasks(app)

def _register_blueprints_and_routes(app):
    """Isola os registros de rotas, mantendo o Factory limpo."""
    with app.app_context():
        from .routes import register_blueprints
        register_blueprints(app)
        from . import models  # para que a migração os reconheça
        
    @app.route('/medals/<path:filename>')
    def serve_medal_image(filename):
        directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'medals')
        return send_from_directory(directory, filename)
    
    @app.route('/api/public/stats', methods=['GET'])
    def get_public_stats():
        from .models import User, Activity, Class, SystemStat
        try:
            visits_stat = SystemStat.query.filter_by(key='total_visits').first()
            total_visits = int(visits_stat.value) if visits_stat else 0
            
            return jsonify({
                "users": User.query.count(),
                "professors": User.query.filter_by(role='professor').count(),
                "students": User.query.filter_by(role='aluno').count(),
                "activities": Activity.query.count(),
                "classes": Class.query.count(),
                "total_visits": total_visits
            }), 200
        except Exception as e:
            app.logger.error(f"Erro ao buscar stats publicas: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @app.route('/api/public/hit', methods=['POST'])
    def register_public_hit():
        from .models import SystemStat, db
        try:
            visits_stat = SystemStat.query.filter_by(key='total_visits').first()
            if not visits_stat:
                visits_stat = SystemStat(key='total_visits', value='1')
                db.session.add(visits_stat)
            else:
                visits_stat.value = str(int(visits_stat.value) + 1)
            db.session.commit()
            return jsonify({"status": "success", "total_visits": int(visits_stat.value)}), 200
        except Exception as e:
            app.logger.error(f"Erro ao registrar hit publico: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Endpoint ultraleve para keep-alive (UptimeRobot, etc) evitar cold start"""
        return jsonify({"status": "ok", "message": "Server is awake"}), 200

def _register_cli_commands(app):
    """Centraliza a definição de comandos de linha de comando."""
    
    @app.cli.command("clean-paths")
    def clean_avatar_paths_command():
        """Encontra e corrige caminhos de imagem de avatares incorretos no banco de dados."""
        from .models import db, ActivityProgress, StoreItem, User
        from sqlalchemy.orm.attributes import flag_modified
        import json
        
        print("Iniciando limpeza de caminhos de avatares...")
        updated_count = 0
        
        for progress in ActivityProgress.query.all():
            modified = False
            if progress.equipped_activity_avatar_url and progress.equipped_activity_avatar_url.startswith('/images/'):
                progress.equipped_activity_avatar_url = progress.equipped_activity_avatar_url.replace('/images/avatars/', '/avatars/')
                modified = True
            if progress.unlocked_activity_avatars:
                new_list = []
                list_changed = False
                for avatar in progress.unlocked_activity_avatars:
                    if isinstance(avatar, dict) and avatar.get('url', '').startswith('/images/'):
                        avatar['url'] = avatar['url'].replace('/images/avatars/', '/avatars/')
                        list_changed = True
                    new_list.append(avatar)
                if list_changed:
                    progress.unlocked_activity_avatars = new_list
                    flag_modified(progress, "unlocked_activity_avatars")
                    modified = True
            if modified: updated_count += 1
            
        for item in StoreItem.query.filter_by(item_type='avatar').all():
            if item.effect_id:
                effect = item.effect_id
                if isinstance(effect, str):
                    try: effect = json.loads(effect)
                    except json.JSONDecodeError: continue
                if isinstance(effect, dict) and effect.get('url', '').startswith('/images/'):
                    effect['url'] = effect['url'].replace('/images/avatars/', '/avatars/')
                    item.effect_id = effect
                    flag_modified(item, "effect_id")
                    updated_count += 1
                    
        for user in User.query.all():
            modified = False
            if user.profile_picture and user.profile_picture.startswith('/images/'):
                user.profile_picture = user.profile_picture.replace('/images/avatars/', '/avatars/')
                modified = True
            if user.unlocked_global_avatars:
                new_list = []
                list_changed = False
                for avatar in user.unlocked_global_avatars:
                    if isinstance(avatar, dict) and avatar.get('url', '').startswith('/images/'):
                        avatar['url'] = avatar['url'].replace('/images/avatars/', '/avatars/')
                        list_changed = True
                    new_list.append(avatar)
                if list_changed:
                    user.unlocked_global_avatars = new_list
                    flag_modified(user, "unlocked_global_avatars")
                    modified = True
            if modified: updated_count += 1
            
        if updated_count > 0:
            db.session.commit()
            print(f"Limpeza concluída! {updated_count} ocorrências corrigidas.")
        else:
            print("Nenhum caminho incorreto foi encontrado.")

    @app.cli.command("seed-medals")
    def seed_medals_command():
        """Popula ou ATUALIZA a base de dados com as medalhas predefinidas."""
        from .models import db, Medal
        
        medals_data = [
            {'name': 'Medalha do Inspetor', 'description': 'Atingir 100% de acerto em todos os questionários e tarefas de uma atividade na primeira tentativa.', 'image_url': '/medals/MedalhaInspetor.webp', 'type': 'ACTIVITY_TEMPLATE', 'notes': 'Incentivar a atenção ao detalhe e a busca pela perfeição.'},
            {'name': 'Medalha do Explorador', 'description': 'Completar todos os módulos e atividades de uma trilha de aprendizagem.', 'image_url': '/medals/MedalhaExplorador.webp', 'type': 'ACTIVITY_TEMPLATE', 'notes': 'Celebrar a finalização completa de uma jornada de aprendizagem.'},
            {'name': 'Medalha do Velocista', 'description': 'Estar entre os 3 primeiros a concluir esta atividade.', 'image_url': '/medals/MedalhaVelocista.webp', 'type': 'ACTIVITY_TEMPLATE', 'notes': 'Recompensar a agilidade e a rapidez na conclusão.'},
            {'name': 'Medalha "Fênix"', 'description': 'Refazer um módulo com baixo desempenho dentro da atividade e alcançar uma nota de excelência.', 'image_url': '/medals/MedalhaFenix.webp', 'type': 'ACTIVITY_TEMPLATE', 'notes': 'Promover a resiliência e a mentalidade de crescimento.'},
            {'name': 'Medalha "Peça-Chave"', 'description': 'Resolver um desafio ou problema "bloqueador" dentro de uma atividade.', 'image_url': '/medals/MedalhaPecaChave.webp', 'type': 'ACTIVITY_TEMPLATE', 'notes': 'Recompensar o pensamento crítico e a resolução de problemas complexos.'},
            {'name': 'Medalha "Arquiteto do Conhecimento"', 'description': 'Completar um módulo dentro da atividade que seja marcado como "fundamental".', 'image_url': '/medals/MedalhaArquiteto.webp', 'type': 'ACTIVITY_TEMPLATE', 'notes': 'Reforçar a importância de dominar os fundamentos.'},
            {'name': 'Medalha do Mestre', 'description': 'Concluir a atividade de nível mais avançado ("especialista" ou "masterclass") numa área.', 'image_url': '/medals/MedalhaMestre.webp', 'type': 'ACTIVITY_TEMPLATE', 'notes': 'Reconhecer o mais alto nível de especialização numa atividade.'},
            {'name': 'Medalha do Inovador', 'description': 'Submeter um projeto que receba nota máxima no critério de "Criatividade e Originalidade".', 'image_url': '/medals/MedalhaInovador.webp', 'type': 'ACTIVITY_TEMPLATE', 'notes': 'Estimular o pensamento criativo e a experimentação.'},
            {'name': 'Medalha "Diamante de Excelência"', 'description': 'Atingir o nível máximo de maestria, completando 100% de todos os cursos, trilhas e desafios disponíveis.', 'image_url': '/medals/MedalhaDiamante.webp', 'type': 'PLATFORM', 'notes': 'Servir como o objetivo final e a maior honra da plataforma.'},
            {'name': 'Medalha do Maratonista', 'description': 'Manter uma sequência de estudos diária por 7, 15 ou 30 dias consecutivos.', 'image_url': '/medals/MedalhaMaratonista.webp', 'type': 'PLATFORM', 'notes': 'Fomentar o hábito e a disciplina da aprendizagem contínua.'},
            {'name': 'Medalha "Espírito de Equipe"', 'description': 'Concluir com sucesso um projeto em grupo com avaliações positivas dos colegas.', 'image_url': '/medals/MedalhaEquipe.webp', 'type': 'PLATFORM', 'notes': 'Valorizar a colaboração, a comunicação e o trabalho em equipa.'},
            {'name': 'Medalha "Semeador do Saber"', 'description': 'Atuar como mentor ou ter 5 respostas marcadas como "melhor solução" nos fóruns.', 'image_url': '/medals/MedalhaSemearSaber.webp', 'type': 'PLATFORM', 'notes': 'Incentivar a partilha de conhecimento e o ensino entre pares.'},
            {'name': 'Medalha do Conector', 'description': 'Convidar 3 ou mais novos utilizadores para a plataforma que completem o primeiro módulo.', 'image_url': '/medals/MedalhaConector.webp', 'type': 'PLATFORM', 'notes': 'Recompensar a advocacia da plataforma e o crescimento da comunidade.'},
            {'name': 'Medalha do Embaixador', 'description': 'Partilhar uma conquista significativa numa rede social com a hashtag oficial da plataforma.', 'image_url': '/medals/MedalhaEmbaixador.webp', 'type': 'PLATFORM', 'notes': 'Encorajar a partilha de sucessos e aumentar a visibilidade da plataforma.'},
            {'name': 'Medalha do Polímata', 'description': 'Concluir cursos completos de 3 ou mais áreas de conhecimento distintas.', 'image_url': '/medals/MedalhaPolimata.webp', 'type': 'PLATFORM', 'notes': 'Incentivar a aprendizagem diversificada e a curiosidade intelectual.'},
            {'name': 'Medalha do Pioneiro', 'description': 'Estar entre os primeiros 10 utilizadores a concluir um curso recém-lançado.', 'image_url': '/medals/MedalhaPioneiro.webp', 'type': 'PLATFORM', 'notes': 'Recompensar os "early adopters" e o engajamento com novos conteúdos.'},
            {'name': 'Medalha do Curioso', 'description': 'Fazer 10 ou mais perguntas pertinentes e bem formuladas nos fóruns.', 'image_url': '/medals/MedalhaCurioso.webp', 'type': 'PLATFORM', 'notes': 'Incentivar a curiosidade e a coragem de perguntar.'},
            {'name': 'Medalha do Veterano', 'description': 'Comemorar 1 ano de atividade contínua na plataforma.', 'image_url': '/medals/MedalhaVeterano.webp', 'type': 'PLATFORM', 'notes': 'Celebrar a lealdade e o compromisso a longo prazo.'},
            {'name': 'Medalha do Caçador de Tesouros', 'description': 'Encontrar e interagir com um conteúdo secreto ("easter egg") na plataforma.', 'image_url': '/medals/MedalhaCacador.webp', 'type': 'PLATFORM', 'notes': 'Recompensar a exploração e a curiosidade que vão além do caminho definido.'},
            {'name': 'Medalha "Sinergia"', 'description': 'Resolver um problema que exija a aplicação de conhecimentos de, pelo menos, duas áreas distintas.', 'image_url': '/medals/MedalhaSinergia.webp', 'type': 'PLATFORM', 'notes': 'Promover o pensamento interdisciplinar e a capacidade de sintetizar informações.'},
        ]

        print("Iniciando o seeding/atualização de medalhas...")
        update_count = 0
        create_count = 0
        for data in medals_data:
            existing_medal = Medal.query.filter_by(name=data['name']).first()
            if existing_medal:
                if (existing_medal.image_url != data['image_url'] or 
                    existing_medal.description != data['description'] or
                    existing_medal.type != data['type'] or
                    existing_medal.notes != data['notes']):
                    
                    existing_medal.image_url = data['image_url']
                    existing_medal.description = data['description']
                    existing_medal.type = data['type']
                    existing_medal.notes = data['notes']
                    update_count += 1
            else:
                medal = Medal(**data)
                db.session.add(medal)
                create_count += 1
        
        if create_count > 0 or update_count > 0:
            db.session.commit()
            print(f"Sucesso! {create_count} novas medalhas criadas e {update_count} medalhas atualizadas.")
        else:
            print("Nenhuma alteração necessária. A base de dados já está atualizada.")
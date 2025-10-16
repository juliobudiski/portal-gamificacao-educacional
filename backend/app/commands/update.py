# backend/app/commands/update.py

import os
from flask import Flask
from sqlalchemy.orm.attributes import flag_modified
from dotenv import load_dotenv  # <-- 1. IMPORTE A BIBLIOTECA

load_dotenv()
from app import db
from app.models import User, Activity  # Importe todos os modelos que precisar atualizar

# --- CONFIGURAÇÃO CENTRAL DE PADRÕES DO SISTEMA ---
# Mantenha aqui os valores padrão atuais. Quando você atualizar o sistema,
# atualize estes valores e o script garantirá que os dados antigos se alinhem.
CURRENT_DEFAULT_AVATARS = [
    {"url": "/avatars/avatar1.webp", "name": "Avatar Básico 1", "type": "normal"},
    {"url": "/avatars/avatar2.webp", "name": "Avatar Básico 2", "type": "normal"},
    {"url": "/avatars/avatar6.webp", "name": "Avatar Básico 6", "type": "normal"},
    {"url": "/avatars/avatar7.webp", "name": "Avatar Básico 7", "type": "normal"},
    {"url": "/avatars/avatar8.webp", "name": "Avatar Básico 8", "type": "normal"},
    {"url": "/avatars/avatar9.webp", "name": "Avatar Básico 9", "type": "normal"},
    {"url": "/avatars/default_avatar.webp", "name": "Avatar Padrão", "type": "normal"},
]

# --- TAREFAS DE ATUALIZAÇÃO ---
# Cada função representa uma "migração" ou "tarefa de atualização".
# Elas recebem um objeto do banco (ex: um usuário) e retornam True se algo mudou.

def _update_user_avatars(user):
    """Garante que o usuário tenha todos os avatares padrão atuais."""
    changed = False
    if user.unlocked_global_avatars is None:
        user.unlocked_global_avatars = []
    
    user_avatar_urls = {avatar['url'] for avatar in user.unlocked_global_avatars}
    
    for default_avatar in CURRENT_DEFAULT_AVATARS:
        if default_avatar['url'] not in user_avatar_urls:
            print(f"  [AVATAR] Adicionando '{default_avatar['name']}' para o usuário {user.email}")
            user.unlocked_global_avatars.append(default_avatar)
            changed = True
            
    if changed:
        flag_modified(user, "unlocked_global_avatars")
        
    return changed

def _update_user_default_role(user):
    """Define um 'role' padrão para usuários antigos que possam não ter um."""
    changed = False
    if not user.role:
        print(f"  [ROLE] Definindo role padrão 'aluno' para o usuário {user.email}")
        user.role = 'aluno'
        changed = True
    return changed

# --- ORQUESTRADOR PRINCIPAL ---
# Esta função chama todas as pequenas tarefas de atualização.

def apply_user_updates(user):
    """Aplica todas as atualizações pendentes para um único usuário."""
    # Adicione novas funções de atualização de usuário a esta lista
    update_tasks = [
        _update_user_avatars,
        _update_user_default_role,
        # Adicione sua próxima função de atualização de usuário aqui
    ]
    
    # Executa cada tarefa. 'any' para a execução assim que uma mudança é feita
    # e garante que o objeto seja marcado como alterado.
    was_user_changed = any(task(user) for task in update_tasks)
    
    return was_user_changed

# --- CONFIGURAÇÃO E EXECUÇÃO DO SCRIPT ---
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def run_updates():
    """
    Função principal que executa a lógica de migração para todos os dados.
    """
    with app.app_context():
        print("🚀 Iniciando script de atualização de dados existentes...")
        
        # --- Atualizando Usuários ---
        print("\nVerificando usuários...")
        all_users = User.query.all()
        updated_users_count = 0
        for user in all_users:
            if apply_user_updates(user):
                updated_users_count += 1
        
        if updated_users_count > 0:
            print(f"\n✅ {updated_users_count} usuários foram atualizados.")
        else:
            print("✅ Nenhum usuário precisou de atualização.")

        # --- Adicione aqui a lógica para outros modelos (Ex: Atividades) ---
        # print("\nVerificando atividades...")
        # all_activities = Activity.query.all()
        # ... (loop e lógica similar)

        # --- SALVANDO TUDO NO FINAL ---
        if updated_users_count > 0: # Adicione outras contagens aqui (ex: or updated_activities_count > 0)
            print("\n💾 Salvando todas as alterações no banco de dados...")
            db.session.commit()
            print("✨ Alterações salvas com sucesso!")
        else:
            print("\nNenhuma alteração necessária no banco de dados.")
            
        print("\nScript de atualização concluído.")

if __name__ == '__main__':
    run_updates()
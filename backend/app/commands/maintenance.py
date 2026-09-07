# backend/app/commands/maintenance.py

import click
from flask.cli import with_appcontext
from app import db
from app.models import Medal, UserUnlockedMedal

@click.command('prune-medals')
@with_appcontext
def prune_medals_command():
    """
    Remove do banco de dados todas as medalhas que não sejam as 4 oficiais.
    Útil para limpar medalhas 'fantasmas' de versões anteriores.
    """
    # A Lista de Ouro - Apenas estas devem sobreviver
    ALLOWED_MEDALS = [
        "Medalha do Explorador",
        "Medalha do Inspetor",
        "Medalha do Velocista",
        "Medalha \"Fênix\""
    ]

    print(f"--- Iniciando limpeza de medalhas ---")
    print(f"Permitidas: {ALLOWED_MEDALS}")

    # Busca todas as medalhas que NÃO estão na lista permitida
    # O uso do notin_ é o jeito SQLalchemy de fazer "WHERE name NOT IN (...)"
    medals_to_delete = Medal.query.filter(Medal.name.notin_(ALLOWED_MEDALS)).all()

    if not medals_to_delete:
        print("Nenhuma medalha obsoleta encontrada. O banco já está limpo.")
        return

    count = 0
    for medal in medals_to_delete:
        print(f"Removendo medalha obsoleta: {medal.name}...")
        
        # 1. Primeiro removemos as associações (quem ganhou essa medalha)
        # para evitar erro de Foreign Key
        unlocks_deleted = UserUnlockedMedal.query.filter_by(medal_id=medal.id).delete()
        if unlocks_deleted > 0:
            print(f"  -> {unlocks_deleted} registros de desbloqueio removidos para esta medalha.")

        # 2. Removemos a medalha em si
        db.session.delete(medal)
        count += 1

    try:
        db.session.commit()
        print(f"\nSUCESSO: {count} medalhas obsoletas foram removidas permanentemente.")
    except Exception as e:
        db.session.rollback()
        print(f"\nERRO: Falha ao limpar banco de dados: {e}")

def auto_upgrade_contact_schema(app):
    """
    Garante que as colunas 'status' e 'access_code' existam na tabela 'contact_messages'.
    Executado de forma segura e não destrutiva no startup (PostgreSQL e SQLite).
    """
    with app.app_context():
        try:
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            
            # Se a tabela ainda não existir, cria-a
            if not inspector.has_table('contact_messages'):
                from app.models import ContactMessage
                ContactMessage.__table__.create(db.engine, checkfirst=True)
                print("✅ [DB AUTO-MIGRATE] Tabela contact_messages criada com sucesso.")
                return

            columns = [c['name'] for c in inspector.get_columns('contact_messages')]
            with db.engine.connect() as conn:
                if 'status' not in columns:
                    print("⚠️ [DB AUTO-MIGRATE] Adicionando coluna 'status' em contact_messages...")
                    conn.execute(text("ALTER TABLE contact_messages ADD COLUMN status VARCHAR(50) DEFAULT 'Pendente' NOT NULL;"))
                    conn.commit()
                    print("✅ [DB AUTO-MIGRATE] Coluna 'status' adicionada com sucesso.")
                
                if 'access_code' not in columns:
                    print("⚠️ [DB AUTO-MIGRATE] Adicionando coluna 'access_code' em contact_messages...")
                    conn.execute(text("ALTER TABLE contact_messages ADD COLUMN access_code VARCHAR(100);"))
                    conn.commit()
                    print("✅ [DB AUTO-MIGRATE] Coluna 'access_code' adicionada com sucesso.")
        except Exception as e:
            print(f"⚠️ [DB AUTO-MIGRATE] Aviso ao sincronizar schema de contact_messages: {e}")

def init_app(app):
    app.cli.add_command(prune_medals_command)
    auto_upgrade_contact_schema(app)
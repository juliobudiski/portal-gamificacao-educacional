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

def init_app(app):
    app.cli.add_command(prune_medals_command)
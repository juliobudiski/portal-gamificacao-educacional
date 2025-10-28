# backend/app/commands/triggers.py

import click
from flask.cli import with_appcontext
from app.models import db, User, Medal, UserUnlockedMedal
from app.routes.medals import MEDAL_CHECK_FUNCTIONS  # Vamos importar o mapa de funções

@click.command('test-medal')
@click.argument('user_email')
@click.argument('medal_name')
@click.option('--activity_id', default=1, help='ID da atividade para o contexto do teste.')
@with_appcontext
def test_medal_command(user_email, medal_name, activity_id):
    """
    Testa e opcionalmente concede uma medalha específica para um usuário.
    
    Exemplos:
    flask test-medal alunoteste@gmail.com "Explorador"
    flask test-medal alunoteste@gmail.com "Inspetor" --activity_id 2
    """
    print(f"--- Iniciando teste para a medalha '{medal_name}' para o usuário '{user_email}' ---")
    print(f"DEBUG: Procurando por medalha com o nome exato: '{medal_name}' (Tamanho: {len(medal_name)})")
    # Vamos pegar TODAS as medalhas do banco para comparar
    all_medals_in_db = Medal.query.all()
    if not all_medals_in_db:
        print("ERRO FATAL: Nenhuma medalha encontrada na tabela 'Medal'. A tabela está vazia?")
        return
    all_medal_names = [m.name for m in all_medals_in_db]
    print(f"DEBUG: Nomes de medalhas encontrados no banco de dados: {all_medal_names}")
    user = User.query.filter_by(email=user_email).first()
    if not user:
        print(f"ERRO: Usuário '{user_email}' não encontrado.")
        return

    medal = Medal.query.filter_by(name=medal_name).first()
    if not medal:
        print(f"\nERRO: Medalha '{medal_name}' não encontrada após a busca.")
        return
    
    medal = Medal.query.filter_by(name=medal_name).first()
    
    if not medal:
        print(f"\nERRO: Medalha '{medal_name}' não encontrada após a busca.")
        print("Compare o nome que você digitou com a lista acima. Há alguma diferença (espaços, maiúsculas/minúsculas)?")
        return
    
    # Verifica se o usuário já possui a medalha
    already_unlocked = UserUnlockedMedal.query.filter_by(
        user_id=user.id, 
        medal_id=medal.id,
        activity_id=activity_id
    ).first()

    if already_unlocked:
        print(f"AVISO: O usuário já possui esta medalha na atividade {activity_id}. O teste continuará, mas não haverá novo registro.")

    # Pega a função de verificação correspondente ao nome da medalha
    check_function = MEDAL_CHECK_FUNCTIONS.get(medal.name)
    if not check_function:
        print(f"ERRO: Nenhuma função de verificação encontrada para a medalha '{medal_name}'.")
        return

    print(f"Executando a função de verificação: {check_function.__name__}...")

    # Simula um dicionário de kwargs, caso a função precise
    # No futuro, você pode adicionar mais dados aqui para simular cenários
    kwargs = {'message': 'Simulação de evento via comando de teste.'}

    # Executa a verificação
    try:
        should_unlock = check_function(user, activity_id, **kwargs)
    except Exception as e:
        print(f"ERRO AO EXECUTAR A FUNÇÃO DE VERIFICAÇÃO: {e}")
        return

    # Avalia o resultado
    if should_unlock:
        print("\n[VEREDITO]: SUCESSO! A função de verificação retornou 'True'.")
        if not already_unlocked:
            new_unlock = UserUnlockedMedal(
                user_id=user.id,
                medal_id=medal.id,
                activity_id=activity_id
            )
            db.session.add(new_unlock)
            db.session.commit()
            print(f"A medalha '{medal_name}' foi CONCEDIDA ao usuário na atividade {activity_id}.")
        else:
            print("Nenhum novo registro de medalha foi criado pois ela já havia sido ganha.")
    else:
        print("\n[VEREDITO]: FALHA. A função de verificação retornou 'False'.")
        print("O usuário não atende aos critérios para esta medalha no momento.")

    print("--- Teste finalizado. ---")

def init_app(app):
    """Registra os comandos no app Flask."""
    app.cli.add_command(test_medal_command)
import click
from flask.cli import with_appcontext
# Remova as importações problemáticas do topo
# from app import db
# from app.models import Medal

# ====================================================================================
# FONTE DA VERDADE PARA AS MEDALHAS PADRÃO
#
# Descrição: Esta lista define todas as medalhas que devem existir por padrão na
#            plataforma. Se você quiser adicionar ou alterar uma medalha no futuro,
#            basta modificar esta lista e rodar o comando `flask seed run` novamente.
# ====================================================================================
MEDALS_DATA = [
    {
        "name": "Medalha do Explorador",
        "description": "Concedida por completar bravamente todos os passos de uma atividade.",
        "image_url": "/medalhas/explorador.webp",
        "type": "PLATFORM",
        "notes": "Incentiva a conclusão completa das trilhas de aprendizagem."
    },
    {
        "name": "Medalha do Inspetor",
        "description": "Concedida por concluir uma atividade sem cometer um único erro.",
        "image_url": "/medalhas/inspetor.webp",
        "type": "PLATFORM",
        "notes": "Recompensa a precisão e o domínio do conteúdo."
    },
    {
        "name": "Medalha do Velocista",
        "description": "Concedida por estar entre os três primeiros a finalizar uma atividade.",
        "image_url": "/medalhas/velocista.webp",
        "type": "PLATFORM",
        "notes": "Incentiva a agilidade e a rápida aplicação do conhecimento."
    },
    {
        "name": "Medalha \"Fênix\"",
        "description": "Concedida por corrigir um erro e acertar uma questão que errou anteriormente.",
        "image_url": "/medalhas/fenix.webp",
        "type": "PLATFORM",
        "notes": "Promove a resiliência e o aprendizado com os próprios erros."
    },
    {
        "name": "Medalha \"Peça-Chave\"",
        "description": "Concedida por completar um passo crucial definido pelo professor.",
        "image_url": "/medalhas/peca-chave.webp",
        "type": "PLATFORM",
        "notes": "Permite ao professor destacar e recompensar a conclusão de etapas importantes."
    }
]


# --- LÓGICA DO COMANDO ---

# Cria um grupo de comandos chamado 'seed' para o terminal Flask
@click.group()
def seed():
    """Comandos para popular o banco de dados com dados iniciais."""
    pass

@seed.command()
@with_appcontext
def run():
    """Popula o banco de dados com as medalhas padrão da plataforma."""
    
    # --- INÍCIO DA CORREÇÃO ---
    # Importe o db e os modelos AQUI, dentro da função.
    from app import db
    from app.models import Medal
    # --- FIM DA CORREÇÃO ---

    click.echo("Iniciando o processo de 'seeding' de medalhas...")

    try:
        # Pega os nomes de todas as medalhas que já existem para não criar duplicatas
        existing_medals = {medal.name for medal in Medal.query.all()}
        medals_to_add = []

        for medal_data in MEDALS_DATA:
            if medal_data["name"] not in existing_medals:
                new_medal = Medal(**medal_data)
                medals_to_add.append(new_medal)
                click.echo(f"  -> Preparando medalha: {medal_data['name']}")
            else:
                click.echo(f"  -> Medalha já existe, pulando: {medal_data['name']}")

        if not medals_to_add:
            click.secho("\nNenhuma nova medalha para adicionar. O banco de dados já está atualizado.", fg="yellow")
            return

        db.session.add_all(medals_to_add)
        db.session.commit()

        click.secho(f"\nSUCESSO! {len(medals_to_add)} novas medalhas foram adicionadas ao banco de dados.", fg="green")

    except Exception as e:
        db.session.rollback()
        click.secho(f"\nERRO: Ocorreu um problema durante o 'seeding': {e}", fg="red")

# Função para registrar o grupo de comandos no aplicativo Flask
def init_app(app):
    """Registra os comandos de CLI no app Flask."""
    app.cli.add_command(seed)


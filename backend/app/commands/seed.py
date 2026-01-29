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
        "image_url": "/medals/explorador.webp",
        "type": "PLATFORM",
        "notes": "Incentiva a conclusão completa das trilhas de aprendizagem."
    },
    {
        "name": "Medalha do Inspetor",
        "description": "Concedida por concluir uma atividade sem cometer um único erro.",
        "image_url": "/medals/inspetor.webp",
        "type": "PLATFORM",
        "notes": "Recompensa a precisão e o domínio do conteúdo."
    },
    {
        "name": "Medalha do Velocista",
        "description": "Concedida por estar entre os três primeiros a finalizar uma atividade.",
        "image_url": "/medals/velocista.webp",
        "type": "PLATFORM",
        "notes": "Incentiva a agilidade e a rápida aplicação do conhecimento."
    },
    {
        "name": "Medalha \"Fênix\"",
        "description": "Concedida por corrigir um erro e acertar uma questão que errou anteriormente.",
        "image_url": "/medals/fenix.webp",
        "type": "PLATFORM",
        "notes": "Promove a resiliência e o aprendizado com os próprios erros."
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
    """Popula e ATUALIZA as medalhas no banco de dados."""
    
    from app import db
    from app.models import Medal

    click.echo("Iniciando atualização de medalhas...")

    try:
        count_new = 0
        count_updated = 0

        for data in MEDALS_DATA:
            # Procura a medalha pelo nome
            medal = Medal.query.filter_by(name=data["name"]).first()

            if medal:
                # SE JÁ EXISTE: Atualiza a URL da imagem e descrição
                if medal.image_url != data["image_url"] or medal.description != data["description"]:
                    medal.image_url = data["image_url"]
                    medal.description = data["description"]
                    medal.type = data["type"]
                    medal.notes = data["notes"]
                    count_updated += 1
                    click.echo(f"  -> [ATUALIZADO] {data['name']}")
                else:
                    click.echo(f"  -> [INTACTO] {data['name']}")
            else:
                # SE NÃO EXISTE: Cria nova
                new_medal = Medal(**data)
                db.session.add(new_medal)
                count_new += 1
                click.echo(f"  -> [CRIADO] {data['name']}")

        db.session.commit()
        click.secho(f"\nConcluído! {count_new} criadas, {count_updated} atualizadas.", fg="green")

    except Exception as e:
        db.session.rollback()
        click.secho(f"\nERRO: {e}", fg="red")
        
def init_app(app):
    app.cli.add_command(seed)
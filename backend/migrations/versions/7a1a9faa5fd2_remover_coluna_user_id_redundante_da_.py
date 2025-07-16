"""Remover coluna user_id redundante da tabela activity

Revision ID: 7a1a9faa5fd2
Revises: 8d47205c3e0d
Create Date: 2025-07-15 16:26:15.792433

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '<NOVO_ID_DE_REVISAO>'
down_revision = '8d47205c3e0d'
branch_labels = None
depends_on = None


def upgrade():
    # ### comandos auto gerados pelo Alembic - por favor ajuste! ###
    with op.batch_alter_table('activity', schema=None) as batch_op:
        # Primeiro, remove a restrição de chave estrangeira
        batch_op.drop_constraint('fk_activity_user_id', type_='foreignkey')
        # Em seguida, remove a coluna
        batch_op.drop_column('user_id')

    # ### fim dos comandos auto gerados pelo Alembic ###


def downgrade():
    # ### comandos auto gerados pelo Alembic - por favor ajuste! ###
    with op.batch_alter_table('activity', schema=None) as batch_op:
        # Adiciona a coluna novamente
        batch_op.add_column(sa.Column('user_id', sa.Integer(), autoincrement=False, nullable=False))
        # Adiciona a restrição de chave estrangeira novamente
        batch_op.create_foreign_key('fk_activity_user_id', 'user', ['user_id'], ['id'])

    # ### fim dos comandos auto gerados pelo Alembic ###

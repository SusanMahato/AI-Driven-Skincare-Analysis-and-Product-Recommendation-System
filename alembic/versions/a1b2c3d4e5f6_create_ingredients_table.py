"""create ingredients table

Revision ID: a1b2c3d4e5f6
Revises: 1cd16c8d6ca7
Create Date: 2026-06-22 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '1cd16c8d6ca7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('ingredients',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('benefit_description', sa.Text(), nullable=True),
    sa.Column('condition_tags', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('skin_type_tags', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('conflict_with', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('safe_time', sa.String(length=20), nullable=True),
    sa.Column('weather_tags', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_ingredients_id'), 'ingredients', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_ingredients_id'), table_name='ingredients')
    op.drop_table('ingredients')
"""create products table

Revision ID: b2c3d4e5f6a1
Revises: a1b2c3d4e5f6
Create Date: 2026-06-22 10:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b2c3d4e5f6a1'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('products',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('brand', sa.String(length=100), nullable=False),
    sa.Column('category', sa.String(length=50), nullable=False),
    sa.Column('key_ingredients', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('condition_tags', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('skin_type_tags', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('weather_tags', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('price_usd', sa.Float(), nullable=True),
    sa.Column('price_npr', sa.Integer(), nullable=True),
    sa.Column('price_tier', sa.String(length=20), nullable=False),
    sa.Column('buy_link_global', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_products_id'), 'products', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_products_id'), table_name='products')
    op.drop_table('products')
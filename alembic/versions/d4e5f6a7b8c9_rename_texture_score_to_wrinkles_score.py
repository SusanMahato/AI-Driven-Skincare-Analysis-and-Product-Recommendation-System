"""rename texture_score to wrinkles_score

Revision ID: d4e5f6a7b8c9
Revises: multi_photo_support
Create Date: 2026-07-02 16:39:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'multi_photo_support'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('scans', 'texture_score', new_column_name='wrinkles_score')


def downgrade() -> None:
    op.alter_column('scans', 'wrinkles_score', new_column_name='texture_score')
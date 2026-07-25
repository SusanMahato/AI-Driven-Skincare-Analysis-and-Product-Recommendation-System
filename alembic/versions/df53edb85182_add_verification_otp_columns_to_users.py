"""add verification otp columns to users

Revision ID: df53edb85182
Revises: d4e5f6a7b8c9
Create Date: 2026-07-23 15:01:07.975834

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'df53edb85182'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('verification_otp', sa.String(), nullable=True))
    op.add_column('users', sa.Column('verification_otp_expires', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'verification_otp_expires')
    op.drop_column('users', 'verification_otp')
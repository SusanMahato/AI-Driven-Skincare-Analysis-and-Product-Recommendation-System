"""Add multi-photo support to scans table

Revision ID: multi_photo_support
Revises: c3d4e5f6a1b2
Create Date: 2026-06-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'multi_photo_support'
down_revision = 'c3d4e5f6a1b2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('scans', sa.Column('photo_url_1', sa.String(), nullable=True))
    op.add_column('scans', sa.Column('photo_url_2', sa.String(), nullable=True))
    op.add_column('scans', sa.Column('photo_url_3', sa.String(), nullable=True))
    op.add_column('scans', sa.Column('photo_angle_1', sa.String(), server_default='front', nullable=True))
    op.add_column('scans', sa.Column('photo_angle_2', sa.String(), server_default='left', nullable=True))
    op.add_column('scans', sa.Column('photo_angle_3', sa.String(), server_default='right', nullable=True))
    op.add_column('scans', sa.Column('photo_confidence_1', sa.Float(), nullable=True))
    op.add_column('scans', sa.Column('photo_confidence_2', sa.Float(), nullable=True))
    op.add_column('scans', sa.Column('photo_confidence_3', sa.Float(), nullable=True))
    op.add_column('scans', sa.Column('individual_photo_scores', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('scans', 'individual_photo_scores')
    op.drop_column('scans', 'photo_confidence_3')
    op.drop_column('scans', 'photo_confidence_2')
    op.drop_column('scans', 'photo_confidence_1')
    op.drop_column('scans', 'photo_angle_3')
    op.drop_column('scans', 'photo_angle_2')
    op.drop_column('scans', 'photo_angle_1')
    op.drop_column('scans', 'photo_url_3')
    op.drop_column('scans', 'photo_url_2')
    op.drop_column('scans', 'photo_url_1')

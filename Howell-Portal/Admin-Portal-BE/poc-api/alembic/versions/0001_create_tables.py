"""create poc api tables

Revision ID: 0001_create_tables
Revises:
Create Date: 2026-03-08 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_create_tables"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "usersession",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_email", sa.String(), nullable=False),
        sa.Column("display_name", sa.String(), nullable=True),
        sa.Column("access_token", sa.String(), nullable=False),
        sa.Column("refresh_token", sa.String(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scopes_json", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_email"),
    )
    op.create_index("ix_usersession_user_email", "usersession", ["user_email"])

    op.create_table(
        "pocconfig",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_email", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("company_name", sa.String(), nullable=False),
        sa.Column("config_json", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pocconfig_user_email", "pocconfig", ["user_email"])

    op.create_table(
        "pocmultiview",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_email", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("multi_view_json", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pocmultiview_user_email", "pocmultiview", ["user_email"])


def downgrade() -> None:
    op.drop_index("ix_pocmultiview_user_email", table_name="pocmultiview")
    op.drop_table("pocmultiview")
    op.drop_index("ix_pocconfig_user_email", table_name="pocconfig")
    op.drop_table("pocconfig")
    op.drop_index("ix_usersession_user_email", table_name="usersession")
    op.drop_table("usersession")

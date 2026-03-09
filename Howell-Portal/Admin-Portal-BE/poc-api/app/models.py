from datetime import datetime, timezone
from uuid import uuid4

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserSession(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_email: str = Field(index=True, unique=True)
    display_name: str | None = None
    access_token: str
    refresh_token: str | None = None
    expires_at: datetime | None = None
    scopes_json: str = "[]"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class POCConfig(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_email: str = Field(index=True)
    name: str
    company_name: str
    config_json: str
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class POCMultiView(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_email: str = Field(index=True)
    name: str
    multi_view_json: str
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class PortalRuntimeStatus(SQLModel, table=True):
    id: str = Field(primary_key=True)
    client_id: str = Field(index=True)
    client_name: str | None = None
    application_id: str = Field(index=True)
    application_name: str | None = None
    portal_name: str
    portal_url: str | None = None
    environment: str | None = None
    status: str = "live"
    message: str | None = None
    response_time_ms: int | None = None
    current_path: str | None = None
    build_version: str | None = None
    last_ping_at: datetime = Field(default_factory=utc_now, index=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

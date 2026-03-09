from functools import lru_cache
from urllib.parse import quote

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        env_prefix="POC_API_",
    )

    app_name: str = "Howell POC API"
    environment: str = "development"
    log_level: str = "info"

    database_url: str = "sqlite:///./poc_api.db"
    db_host: str | None = None
    db_port: int = 5432
    db_name: str = "postgres"
    db_user: str = "postgres"
    db_password: str | None = None
    db_ssl_mode: str = "require"
    session_secret: str = "replace-this-in-production"
    session_same_site: str = "lax"
    session_https_only: bool = False
    allowed_origins: str = "http://localhost:5173"
    frontend_redirect_url: str = "http://localhost:5173/demo-workbench"
    allow_dev_header_auth: bool = True
    portal_runtime_ingest_key: str | None = None
    portal_runtime_stale_after_seconds: int = 180
    operator_users_schema: str = "public"
    operator_users_table: str = "operator_users"

    ms_client_id: str | None = None
    ms_client_secret: str | None = None
    ms_tenant_id: str | None = None
    ms_redirect_uri: str = "http://localhost:8000/api/auth/microsoft/callback"
    ms_scopes_csv: str = "openid,profile,offline_access,User.Read,Report.Read.All,Workspace.Read.All"

    cookie_max_age_seconds: int = Field(default=60 * 60 * 8)

    @property
    def ms_scopes(self) -> list[str]:
        return [scope.strip() for scope in self.ms_scopes_csv.split(",") if scope.strip()]

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def ms_configured(self) -> bool:
        return bool(self.ms_client_id and self.ms_client_secret and self.ms_tenant_id)

    @property
    def resolved_database_url(self) -> str:
        if self.db_host and self.db_password:
            encoded_password = quote(self.db_password, safe="")
            return (
                f"postgresql+psycopg://{self.db_user}:{encoded_password}"
                f"@{self.db_host}:{self.db_port}/{self.db_name}?sslmode={self.db_ssl_mode}"
            )

        if self.database_url.startswith("postgresql://"):
            return "postgresql+psycopg://" + self.database_url.removeprefix("postgresql://")

        if self.database_url.startswith("postgres://"):
            return "postgresql+psycopg://" + self.database_url.removeprefix("postgres://")

        return self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()

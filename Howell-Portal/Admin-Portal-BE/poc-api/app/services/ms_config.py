from dataclasses import dataclass

from app.config import Settings


@dataclass
class ResolvedMicrosoftConfig:
    client_id: str
    client_secret: str
    tenant_id: str
    redirect_uri: str
    frontend_redirect_url: str
    scopes_csv: str
    scopes: list[str]
    configured: bool


_runtime_config: dict[str, str] = {}
_reserved_scopes = {"openid", "profile", "offline_access"}


def set_runtime_microsoft_config(
    *,
    client_id: str,
    client_secret: str,
    tenant_id: str,
    settings: Settings,
) -> ResolvedMicrosoftConfig:
    _runtime_config["client_id"] = client_id.strip()
    _runtime_config["client_secret"] = client_secret.strip()
    _runtime_config["tenant_id"] = tenant_id.strip()
    return get_resolved_microsoft_config(settings)


def clear_runtime_microsoft_config() -> None:
    _runtime_config.clear()


def get_resolved_microsoft_config(settings: Settings) -> ResolvedMicrosoftConfig:
    client_id = _runtime_config.get("client_id") or (settings.ms_client_id or "")
    client_secret = _runtime_config.get("client_secret") or (settings.ms_client_secret or "")
    tenant_id = _runtime_config.get("tenant_id") or (settings.ms_tenant_id or "")

    scopes = [
        scope.strip()
        for scope in settings.ms_scopes_csv.split(",")
        if scope.strip() and scope.strip().lower() not in _reserved_scopes
    ]
    effective_scopes = scopes or ["User.Read"]

    return ResolvedMicrosoftConfig(
        client_id=client_id,
        client_secret=client_secret,
        tenant_id=tenant_id,
        redirect_uri=settings.ms_redirect_uri,
        frontend_redirect_url=settings.frontend_redirect_url,
        scopes_csv=settings.ms_scopes_csv,
        scopes=effective_scopes,
        configured=bool(client_id and client_secret and tenant_id),
    )

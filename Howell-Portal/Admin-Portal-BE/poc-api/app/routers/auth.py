import json
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from app.config import Settings, get_settings
from app.database import get_session
from app.models import UserSession
from app.schemas import AuthSessionResponse, MicrosoftConfigRequest, MicrosoftConfigResponse
from app.services.ms_config import get_resolved_microsoft_config, set_runtime_microsoft_config
from app.services.msal_client import build_msal_app

router = APIRouter(prefix="/api/auth", tags=["auth"])


def build_msal_app_or_400(*, client_id: str, client_secret: str, tenant_id: str):
    try:
        return build_msal_app(
            client_id=client_id,
            client_secret=client_secret,
            tenant_id=tenant_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Microsoft config is invalid: {exc}",
        ) from exc


@router.get("/microsoft/login")
def microsoft_login(request: Request, settings: Settings = Depends(get_settings)) -> RedirectResponse:
    resolved_config = get_resolved_microsoft_config(settings)
    if not resolved_config.configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Microsoft auth is not configured.",
        )

    msal_app = build_msal_app_or_400(
        client_id=resolved_config.client_id,
        client_secret=resolved_config.client_secret,
        tenant_id=resolved_config.tenant_id,
    )
    flow = msal_app.initiate_auth_code_flow(resolved_config.scopes, redirect_uri=resolved_config.redirect_uri)
    request.session["ms_auth_flow"] = flow
    return RedirectResponse(flow["auth_uri"])


@router.get("/microsoft/callback")
def microsoft_callback(
    request: Request,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    resolved_config = get_resolved_microsoft_config(settings)
    if not resolved_config.configured:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Microsoft auth is not configured.")

    auth_flow = request.session.get("ms_auth_flow")
    if not auth_flow:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Microsoft auth flow in session.")

    msal_app = build_msal_app_or_400(
        client_id=resolved_config.client_id,
        client_secret=resolved_config.client_secret,
        tenant_id=resolved_config.tenant_id,
    )
    result = msal_app.acquire_token_by_auth_code_flow(auth_flow, dict(request.query_params))

    access_token = result.get("access_token")
    if not access_token:
        error_message = result.get("error_description") or result.get("error") or "Microsoft auth failed."
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error_message))

    claims = result.get("id_token_claims", {}) or {}
    user_email = claims.get("preferred_username") or claims.get("upn") or claims.get("email")
    if not user_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to resolve Microsoft user email.")

    display_name = claims.get("name")
    expires_in = int(result.get("expires_in") or 0)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in) if expires_in else None

    existing = session.exec(select(UserSession).where(UserSession.user_email == user_email)).first()
    if existing:
        existing.display_name = display_name
        existing.access_token = access_token
        existing.refresh_token = result.get("refresh_token")
        existing.expires_at = expires_at
        existing.scopes_json = json.dumps(result.get("scope", "").split())
        existing.updated_at = datetime.now(timezone.utc)
        session.add(existing)
    else:
        created = UserSession(
            user_email=user_email,
            display_name=display_name,
            access_token=access_token,
            refresh_token=result.get("refresh_token"),
            expires_at=expires_at,
            scopes_json=json.dumps(result.get("scope", "").split()),
        )
        session.add(created)
    session.commit()

    request.session["user_email"] = user_email
    request.session["user_display_name"] = display_name
    request.session.pop("ms_auth_flow", None)
    return RedirectResponse(resolved_config.frontend_redirect_url)


@router.get("/microsoft/config", response_model=MicrosoftConfigResponse)
def get_microsoft_config(settings: Settings = Depends(get_settings)) -> MicrosoftConfigResponse:
    resolved_config = get_resolved_microsoft_config(settings)
    return MicrosoftConfigResponse(
        configured=resolved_config.configured,
        clientId=resolved_config.client_id or None,
        tenantId=resolved_config.tenant_id or None,
        hasClientSecret=bool(resolved_config.client_secret),
    )


@router.post("/microsoft/config", response_model=MicrosoftConfigResponse)
def update_microsoft_config(
    body: MicrosoftConfigRequest,
    settings: Settings = Depends(get_settings),
) -> MicrosoftConfigResponse:
    resolved_config = set_runtime_microsoft_config(
        client_id=body.clientId,
        client_secret=body.clientSecret,
        tenant_id=body.tenantId,
        settings=settings,
    )
    return MicrosoftConfigResponse(
        configured=resolved_config.configured,
        clientId=resolved_config.client_id or None,
        tenantId=resolved_config.tenant_id or None,
        hasClientSecret=bool(resolved_config.client_secret),
    )


@router.post("/logout")
def logout(request: Request) -> dict[str, Any]:
    request.session.clear()
    return {"ok": True}


@router.get("/session", response_model=AuthSessionResponse)
def get_auth_session(
    request: Request,
    session: Session = Depends(get_session),
) -> AuthSessionResponse:
    user_email = request.session.get("user_email")
    if not user_email:
        return AuthSessionResponse(isAuthenticated=False, scopes=[])

    user_session = session.exec(select(UserSession).where(UserSession.user_email == user_email)).first()
    if not user_session:
        request.session.clear()
        return AuthSessionResponse(isAuthenticated=False, scopes=[])

    scopes = json.loads(user_session.scopes_json) if user_session.scopes_json else []
    expires_at = user_session.expires_at.isoformat() if user_session.expires_at else None
    return AuthSessionResponse(
        isAuthenticated=True,
        userEmail=user_session.user_email,
        displayName=user_session.display_name,
        tokenExpiresAt=expires_at,
        scopes=scopes,
    )

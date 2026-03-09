from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, status
from sqlmodel import Session, select

from .config import Settings, get_settings
from .database import get_session
from .models import UserSession


@dataclass
class AuthenticatedUser:
    email: str
    display_name: str | None = None


def require_session_user(
    request: Request,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUser:
    session_email = request.session.get("user_email")

    if not session_email and settings.allow_dev_header_auth:
        session_email = request.headers.get("x-dev-user-email")
        if session_email:
            return AuthenticatedUser(
                email=session_email,
                display_name=request.headers.get("x-dev-user-name"),
            )

    if not session_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Microsoft session required.")

    user = session.exec(select(UserSession).where(UserSession.user_email == session_email)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session has expired. Reconnect Microsoft.")

    return AuthenticatedUser(email=user.user_email, display_name=user.display_name)

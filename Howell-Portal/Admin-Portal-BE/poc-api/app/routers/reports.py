from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.deps import AuthenticatedUser, require_session_user
from app.models import UserSession
from app.schemas import EmbedTokenRequest, EmbedTokenResponse, ReportsAvailableResponse
from app.services.powerbi import fetch_available_reports, generate_embed_token

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/available", response_model=ReportsAvailableResponse)
async def available_reports(
    user: AuthenticatedUser = Depends(require_session_user),
    session: Session = Depends(get_session),
) -> ReportsAvailableResponse:
    user_session = session.exec(select(UserSession).where(UserSession.user_email == user.email)).first()
    if not user_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found. Reconnect Microsoft.")

    result = await fetch_available_reports(user_session.access_token)
    return ReportsAvailableResponse(
        reports=result.reports,
        skipped={
            "missingIds": result.skipped_missing_ids,
            "missingGroupId": result.skipped_missing_group_id,
        },
        workspacePermissionError=result.workspace_permission_error,
    )


@router.post("/embed-token", response_model=EmbedTokenResponse)
async def embed_token(
    body: EmbedTokenRequest,
    user: AuthenticatedUser = Depends(require_session_user),
    session: Session = Depends(get_session),
) -> EmbedTokenResponse:
    user_session = session.exec(select(UserSession).where(UserSession.user_email == user.email)).first()
    if not user_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found. Reconnect Microsoft.")

    token_result = await generate_embed_token(
        access_token=user_session.access_token,
        report_id=body.reportId,
        group_id=body.groupId,
        dataset_id=body.datasetId,
    )
    return EmbedTokenResponse(
        reportId=body.reportId,
        groupId=body.groupId,
        pageName=body.pageName,
        embedUrl=token_result["embedUrl"],
        embedToken=token_result["embedToken"],
        tokenExpiry=token_result["tokenExpiry"],
    )

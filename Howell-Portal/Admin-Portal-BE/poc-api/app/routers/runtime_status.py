from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlmodel import Session, select

from app.config import Settings, get_settings
from app.database import get_session
from app.models import PortalRuntimeStatus
from app.schemas import (
    PortalRuntimeHeartbeatRequest,
    PortalRuntimeHeartbeatResponse,
    PortalRuntimeStatusRecord,
)

router = APIRouter(prefix="/api/runtime-status", tags=["runtime-status"])


def build_record_id(client_id: str, application_id: str) -> str:
    return f"{client_id}::{application_id}"


def require_ingest_key(settings: Settings, provided_key: str | None) -> None:
    expected_key = settings.portal_runtime_ingest_key
    if expected_key and provided_key != expected_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid portal ingest key.")


def normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def to_status_record(record: PortalRuntimeStatus, stale_after_seconds: int) -> PortalRuntimeStatusRecord:
    now = datetime.now(timezone.utc)
    last_ping_at = normalize_datetime(record.last_ping_at)
    is_stale = (now - last_ping_at).total_seconds() > stale_after_seconds
    effective_status = "down" if is_stale else record.status
    message = record.message or ("Heartbeat not received within the expected window." if is_stale else None)
    return PortalRuntimeStatusRecord(
        recordId=record.id,
        clientId=record.client_id,
        clientName=record.client_name,
        applicationId=record.application_id,
        applicationName=record.application_name,
        portalName=record.portal_name,
        portalUrl=record.portal_url,
        environment=record.environment,
        reportedStatus=record.status,  # type: ignore[arg-type]
        effectiveStatus=effective_status,  # type: ignore[arg-type]
        message=message,
        responseTimeMs=record.response_time_ms,
        currentPath=record.current_path,
        buildVersion=record.build_version,
        lastPingAt=last_ping_at,
        isStale=is_stale,
    )


@router.post("/heartbeat", response_model=PortalRuntimeHeartbeatResponse, status_code=status.HTTP_202_ACCEPTED)
def ingest_runtime_heartbeat(
    body: PortalRuntimeHeartbeatRequest,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
    x_portal_ingest_key: str | None = Header(default=None),
) -> PortalRuntimeHeartbeatResponse:
    require_ingest_key(settings, x_portal_ingest_key)

    record_id = build_record_id(body.clientId, body.applicationId)
    now = datetime.now(timezone.utc)
    last_ping_at = body.checkedAt or now

    record = session.get(PortalRuntimeStatus, record_id)
    if record is None:
        record = PortalRuntimeStatus(
            id=record_id,
            client_id=body.clientId,
            application_id=body.applicationId,
            created_at=now,
        )

    record.client_name = body.clientName
    record.application_name = body.applicationName or body.portalName
    record.portal_name = body.portalName
    record.portal_url = body.portalUrl
    record.environment = body.environment
    record.status = body.status
    record.message = body.message
    record.response_time_ms = body.responseTimeMs
    record.current_path = body.currentPath
    record.build_version = body.buildVersion
    record.last_ping_at = last_ping_at
    record.updated_at = now

    session.add(record)
    session.commit()

    return PortalRuntimeHeartbeatResponse(ok=True, recordId=record_id, receivedAt=now)


@router.get("/applications", response_model=list[PortalRuntimeStatusRecord])
def list_runtime_status(
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> list[PortalRuntimeStatusRecord]:
    records = session.exec(select(PortalRuntimeStatus).order_by(PortalRuntimeStatus.client_id, PortalRuntimeStatus.application_id)).all()
    return [to_status_record(record, settings.portal_runtime_stale_after_seconds) for record in records]

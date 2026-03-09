import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.deps import AuthenticatedUser, require_session_user
from app.models import POCConfig, POCMultiView
from app.schemas import (
    MultiViewRecord,
    MultiViewUpsertRequest,
    POCConfigRecord,
    POCConfigUpsertRequest,
)

router = APIRouter(prefix="/api/poc", tags=["poc"])


@router.get("/configs", response_model=list[POCConfigRecord])
def list_configs(
    user: AuthenticatedUser = Depends(require_session_user),
    session: Session = Depends(get_session),
) -> list[POCConfigRecord]:
    records = session.exec(
        select(POCConfig).where(POCConfig.user_email == user.email).order_by(POCConfig.updated_at.desc())
    ).all()
    return [
        POCConfigRecord(
            id=record.id,
            name=record.name,
            companyName=record.company_name,
            updatedAt=record.updated_at,
            config=json.loads(record.config_json),
        )
        for record in records
    ]


@router.post("/configs", response_model=POCConfigRecord, status_code=status.HTTP_201_CREATED)
def create_config(
    body: POCConfigUpsertRequest,
    user: AuthenticatedUser = Depends(require_session_user),
    session: Session = Depends(get_session),
) -> POCConfigRecord:
    now = datetime.now(timezone.utc)
    record = POCConfig(
        user_email=user.email,
        name=body.name,
        company_name=body.config.companyName,
        config_json=body.config.model_dump_json(),
        created_at=now,
        updated_at=now,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return POCConfigRecord(
        id=record.id,
        name=record.name,
        companyName=record.company_name,
        updatedAt=record.updated_at,
        config=body.config,
    )


@router.put("/configs/{config_id}", response_model=POCConfigRecord)
def update_config(
    config_id: str,
    body: POCConfigUpsertRequest,
    user: AuthenticatedUser = Depends(require_session_user),
    session: Session = Depends(get_session),
) -> POCConfigRecord:
    record = session.get(POCConfig, config_id)
    if not record or record.user_email != user.email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POC config not found.")

    record.name = body.name
    record.company_name = body.config.companyName
    record.config_json = body.config.model_dump_json()
    record.updated_at = datetime.now(timezone.utc)
    session.add(record)
    session.commit()
    session.refresh(record)
    return POCConfigRecord(
        id=record.id,
        name=record.name,
        companyName=record.company_name,
        updatedAt=record.updated_at,
        config=body.config,
    )


@router.delete("/configs/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_config(
    config_id: str,
    user: AuthenticatedUser = Depends(require_session_user),
    session: Session = Depends(get_session),
) -> None:
    record = session.get(POCConfig, config_id)
    if not record or record.user_email != user.email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POC config not found.")
    session.delete(record)
    session.commit()


@router.get("/multiviews", response_model=list[MultiViewRecord])
def list_multiviews(
    user: AuthenticatedUser = Depends(require_session_user),
    session: Session = Depends(get_session),
) -> list[MultiViewRecord]:
    records = session.exec(
        select(POCMultiView).where(POCMultiView.user_email == user.email).order_by(POCMultiView.updated_at.desc())
    ).all()
    return [
        MultiViewRecord(
            id=record.id,
            name=record.name,
            updatedAt=record.updated_at,
            multiView=json.loads(record.multi_view_json),
        )
        for record in records
    ]


@router.post("/multiviews", response_model=MultiViewRecord, status_code=status.HTTP_201_CREATED)
def create_multiview(
    body: MultiViewUpsertRequest,
    user: AuthenticatedUser = Depends(require_session_user),
    session: Session = Depends(get_session),
) -> MultiViewRecord:
    now = datetime.now(timezone.utc)
    record = POCMultiView(
        user_email=user.email,
        name=body.name,
        multi_view_json=body.multiView.model_dump_json(),
        created_at=now,
        updated_at=now,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return MultiViewRecord(
        id=record.id,
        name=record.name,
        updatedAt=record.updated_at,
        multiView=body.multiView,
    )

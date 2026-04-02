import os

os.environ.setdefault("POC_API_DATABASE_URL", "sqlite:///./test_poc_api.db")
os.environ.setdefault("POC_API_SESSION_SECRET", "test-secret")
os.environ.setdefault("POC_API_ALLOW_DEV_HEADER_AUTH", "true")

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session

from app.database import engine
from app.main import app
from app.models import UserSession
from app.services.ms_config import clear_runtime_microsoft_config
from app.services.operator_auth_store import ensure_local_operator_users_table


@pytest.fixture(autouse=True)
def reset_db() -> None:
    clear_runtime_microsoft_config()
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        ensure_local_operator_users_table(session)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def seed_user_session() -> UserSession:
    user = UserSession(
        user_email="reports@example.com",
        display_name="Reports User",
        access_token="test-access-token",
        scopes_json='["Report.Read.All","Workspace.Read.All"]',
    )
    with Session(engine) as session:
        session.add(user)
        session.commit()
        session.refresh(user)
    return user

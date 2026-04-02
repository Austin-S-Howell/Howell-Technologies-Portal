from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from .config import get_settings
from .services.operator_auth_store import ensure_local_operator_users_table

settings = get_settings()
resolved_database_url = settings.resolved_database_url
connect_args = {"check_same_thread": False} if resolved_database_url.startswith("sqlite") else {}
engine = create_engine(resolved_database_url, connect_args=connect_args)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        ensure_local_operator_users_table(session)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

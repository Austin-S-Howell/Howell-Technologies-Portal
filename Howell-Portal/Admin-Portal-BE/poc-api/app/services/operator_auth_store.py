import re

from sqlalchemy import text
from sqlmodel import Session

from app.config import get_settings

_SAFE_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def normalize_username(username: str) -> str:
    return (username or "").strip().lower()


def build_operator_display_name(username: str) -> str:
    local_part = (username or "").split("@", 1)[0].strip()
    if not local_part:
        return "Portal Operator"
    parts = [part for part in re.split(r"[._-]+", local_part) if part]
    if not parts:
        return local_part
    return " ".join(part[:1].upper() + part[1:] for part in parts)


def _quoted_identifier(value: str, *, label: str) -> str:
    normalized = (value or "").strip()
    if not _SAFE_IDENTIFIER_PATTERN.fullmatch(normalized):
        raise RuntimeError(f"Invalid operator auth {label}: {normalized or '<empty>'}")
    return f'"{normalized}"'


def _operator_users_table_ref() -> str:
    settings = get_settings()
    schema = _quoted_identifier(settings.operator_users_schema, label="schema")
    table = _quoted_identifier(settings.operator_users_table, label="table")
    return f"{schema}.{table}"


def find_operator_user(session: Session, username: str) -> dict[str, str] | None:
    normalized = normalize_username(username)
    if not normalized:
        return None

    query = text(
        f"""
        SELECT username, password
        FROM {_operator_users_table_ref()}
        WHERE LOWER(TRIM(username)) = :username
        LIMIT 1
        """
    )
    row = session.exec(query, params={"username": normalized}).first()
    if not row:
        return None

    mapping = row._mapping if hasattr(row, "_mapping") else row
    return {
        "username": str(mapping["username"] or "").strip(),
        "password": str(mapping["password"] or ""),
    }

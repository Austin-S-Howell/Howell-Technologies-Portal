from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import get_settings
from app.database import create_db_and_tables
from app.routers.auth import router as auth_router
from app.routers.poc import router as poc_router
from app.routers.reports import router as reports_router
from app.routers.runtime_status import router as runtime_status_router

settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    max_age=settings.cookie_max_age_seconds,
    same_site=settings.session_same_site,
    https_only=settings.session_https_only,
)


@app.on_event("startup")
def on_startup() -> None:
    settings.validate_security_settings()
    create_db_and_tables()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(poc_router)
app.include_router(runtime_status_router)

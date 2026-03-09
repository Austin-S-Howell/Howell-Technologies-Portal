# Howell POC API

FastAPI backend for:

- Microsoft OAuth session handling
- Power BI report discovery and embed token generation
- Saved POC config and multi-view persistence (SQLite)
- Runtime portal heartbeat/status ingestion for client portal monitoring

## Cloud Run Notes

- The Dockerfile is now Cloud Run compatible and listens on `${PORT}` when provided.
- Cross-origin frontend deployments should set:
  - `POC_API_ALLOWED_ORIGINS`
  - `POC_API_FRONTEND_REDIRECT_URL`
  - `POC_API_SESSION_SAME_SITE=none`
  - `POC_API_SESSION_HTTPS_ONLY=true`
- Database-backed operator login also requires:
  - `POC_API_OPERATOR_USERS_SCHEMA`
  - `POC_API_OPERATOR_USERS_TABLE`
- Example Cloud Run env file:
  - `.env.cloudrun.example`

Important limitation:

- `sqlite:///./poc_api.db` is fine for local dev and short-lived demos, but it is not durable on Cloud Run.
- If you want persistent sessions/configs/reports state in Cloud Run, move `POC_API_DATABASE_URL` to a managed database.
- Supabase Postgres works here by setting `POC_API_DATABASE_URL` to the Supabase connection string and pointing the operator auth config at the table containing `username` and `password` columns.
- In the Cloud Run workflow, you can either:
  - store the full URL in the `POC_API_DATABASE_URL` GitHub secret
  - or store only the password in the `POC_API_DB_PASSWORD` GitHub secret and let the workflow build the URL from the workflow inputs

## Run locally

```bash
cd Howell-Portal/Admin-Portal-BE/poc-api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

## Required env vars (for real Microsoft integration)

- `POC_API_MS_CLIENT_ID`
- `POC_API_MS_CLIENT_SECRET`
- `POC_API_MS_TENANT_ID`
- `POC_API_MS_REDIRECT_URI`
- `POC_API_FRONTEND_REDIRECT_URL`

The API can still run without these values for local non-auth development.

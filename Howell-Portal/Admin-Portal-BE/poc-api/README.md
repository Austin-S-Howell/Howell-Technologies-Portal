# Howell POC API

FastAPI backend for:

- Microsoft OAuth session handling
- Power BI report discovery and embed token generation
- Saved POC config and multi-view persistence (SQLite)

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
- `POC_API_FRONTEND_REDIRECT`

The API can still run without these values for local non-auth development.

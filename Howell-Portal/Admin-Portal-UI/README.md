# Howell Technologies Portal

Monorepo for three related products:

- `apps/operator-portal`: the internal Howell Technologies admin portal used to monitor client application health, client records, and embedded portal access.
- `packages/portal`: the reusable private npm package published as `@howell-technologies/portal`, exposing `<PortalApp />` for client-facing homepage + reports embeds.
- `apps/poc-api`: Python FastAPI backend for Microsoft auth, Power BI workspace discovery, embed token generation, and POC persistence.

## Workspace Commands

```bash
npm install
npm run dev
npm run dev:demo
npm run build
npm run test
```

Operator portal expects the backend at `http://localhost:8000` by default for POC Generator Microsoft/report features.

## App Entrypoints

- Admin portal: `apps/operator-portal`
- Client portal demo consumer: `apps/client-portal-demo`
- Reusable package: `packages/portal`
- Backend API: `apps/poc-api`

## Docker

Build the admin portal image from the repo root:

```bash
docker build -t howell-technologies-portal .
docker run -p 5173:8080 howell-technologies-portal
```

Or use the repo script:

```bash
npm run docker
```

`npm run docker` now starts the frontend only with static/mock login:

- Frontend: `http://localhost:5173`
- Static login credentials:
  - `austin@howelltechnologies.com` / `admin`
  - `brian@howelltechnologies.com` / `admin`
  - `sarah@howelltechnologies.com` / `admin`

Use `npm run docker:stack` when you want the full stack (frontend + backend) via Docker Compose:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- The frontend build in the Docker stack now still uses static/mock login by default.
- The local backend also seeds these operator credentials in SQLite if you hit backend auth directly:
  - `austin@howelltechnologies.com` / `admin`
  - `brian@howelltechnologies.com` / `admin`
  - `sarah@howelltechnologies.com` / `admin`

To point local Docker at Supabase or another managed Postgres instance instead of container-local SQLite, export `POC_API_DATABASE_URL` before `npm run docker`:

```bash
export POC_API_DATABASE_URL='postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require'
export POC_API_OPERATOR_USERS_SCHEMA='public'
export POC_API_OPERATOR_USERS_TABLE='userPreference'
export POC_API_SESSION_SECRET='YOUR_LOCAL_SESSION_SECRET'
```

The backend still supports component-based DB settings (`POC_API_DB_HOST`, `POC_API_DB_USER`, `POC_API_DB_PASSWORD`, etc.) when no full `POC_API_DATABASE_URL` is provided, but the Docker stack now defaults to the local SQLite database unless you explicitly set the full URL. If you want the frontend to use backend auth instead of static login, rebuild with `VITE_STATIC_FE_ONLY=false`.

To run frontend only:

```bash
npm run docker:frontend
```

Build/run backend API only:

```bash
npm run docker:api
```

Run full FE + BE stack:

```bash
npm run docker:stack
```

## CI/CD

- Pull requests run install, build, and test checks.
- Release tags publish `@howell-technologies/portal` to GitHub Packages and build a container image for the admin portal.

## Cloud Run Split Deploy

This repo now supports a HOG-style split deployment where UI and API run as separate Cloud Run services:

- API workflow: `.github/workflows/deploy-api-cloud-run.yml`
- UI workflow: `.github/workflows/deploy-ui-cloud-run.yml`

Recommended order:

1. Deploy API first
2. Deploy UI second

The API workflow attempts to resolve the UI Cloud Run URL and automatically use it for:

- `POC_API_ALLOWED_ORIGINS`
- `POC_API_FRONTEND_REDIRECT_URL`

The UI workflow attempts to resolve the API Cloud Run URL and bake it into the frontend build as:

- `VITE_POC_API_BASE_URL`

Important:

- The backend default SQLite database is only suitable for demos on Cloud Run.
- For persistent production use, provide `POC_API_DATABASE_URL` as a GitHub secret and deploy with ephemeral SQLite disabled.

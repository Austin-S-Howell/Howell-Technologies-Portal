# Howell Operations Portal Implementation Plan (Post-Design)

## Summary
This plan defines the next implementation phase for turning the current admin portal from demo-first UX into a true operations console.  
Execution is intentionally **gated until design is finalized**.

Primary outcome: real-time operational visibility, alert-driven workflows, and auditable client/application oversight in one portal.

## Execution Gate
- Do not start this plan until UI/UX design is approved as "design freeze".
- During design phase, only visual/interaction changes are in scope.
- After freeze, execute phases in order (Phase 0 -> Phase 4).

## Phase 0 - Foundations and Contracts
- Lock domain model for `Client`, `Application`, `ServiceCheck`, `Incident`, `AlertRule`, `TicketLink`, `DeploymentEvent`.
- Define API contracts for frontend consumption in `apps/poc-api` (versioned under `/api/v1`).
- Add environment/config contracts for providers (health check adapters, alert channels, ticket provider).
- Add migration baseline for persisted operations data (SQLite for v1; migration-safe for Postgres later).

Deliverables:
- OpenAPI schema for v1 operations endpoints.
- Pydantic request/response models.
- SQLModel/Alembic tables for core operations entities.

## Phase 1 - Real Health Ingestion + Dashboard Data
- Replace mock dashboard/status data with backend-backed health data.
- Implement ingestion adapters:
  - HTTP health checks
  - optional endpoint auth (token/header)
  - freshness timestamps and timeout tracking
- Build scheduler for check execution and status normalization (`live`, `degraded`, `down`, `unknown`).
- Expose operational data endpoints:
  - `GET /api/v1/ops/summary`
  - `GET /api/v1/ops/applications`
  - `GET /api/v1/ops/applications/{id}`
  - `GET /api/v1/ops/clients/{id}/applications`
- Update operator portal service layer to consume these endpoints (keep mock fallback behind feature flag).

Acceptance:
- Dashboard and status pages load from backend with non-mock freshness timestamps.
- Each application has last check time, response metrics, and normalized health state.

## Phase 2 - Alerts, Incident Workflow, and Ticket Linkage
- Add alert rule engine (threshold + consecutive-failure semantics).
- Add incident lifecycle:
  - open
  - acknowledged
  - investigating
  - mitigated
  - resolved
- Add incident ownership and timeline comments.
- Add ticket integration adapter boundary (Tech Connect first) with linked external ticket metadata.
- Expose endpoints:
  - `POST /api/v1/incidents/{id}/acknowledge`
  - `POST /api/v1/incidents/{id}/assign`
  - `POST /api/v1/incidents/{id}/status`
  - `POST /api/v1/incidents/{id}/ticket-links`
  - `GET /api/v1/incidents`
  - `GET /api/v1/incidents/{id}`
- Add operator UI modules:
  - incident queue
  - incident detail timeline
  - ticket links/actions panel

Acceptance:
- Alerts create incidents automatically from rule breaches.
- Operators can acknowledge/assign/update incidents and link external tickets.

## Phase 3 - Access Control, Audit, and Change Correlation
- Add Microsoft SSO for operator portal auth (replace mock auth).
- Introduce RBAC:
  - `admin`
  - `operator`
  - `viewer`
- Add client-level data scoping by role/assignment.
- Add immutable audit events for:
  - incident status changes
  - assignments
  - rule changes
  - manual overrides
- Add deployment/change event ingestion and correlation to incidents.

Endpoints:
- `GET /api/v1/auth/session`
- `GET /api/v1/audit/events`
- `GET /api/v1/deployments`
- `GET /api/v1/incidents/{id}/correlations`

Acceptance:
- Unauthorized actions are blocked by role.
- Every critical state mutation is traceable via audit history.

## Phase 4 - SLA Reporting and Operational Exports
- Add SLA calculations by client/application (uptime %, MTTR, incident volume).
- Add reporting endpoints and export formats (CSV + JSON).
- Add operator reporting UI with date-range filters and client breakdown.
- Add scheduled monthly snapshot generation for leadership reporting.

Endpoints:
- `GET /api/v1/reports/sla`
- `GET /api/v1/reports/incidents`
- `GET /api/v1/reports/exports`

Acceptance:
- Operators can produce period-based reliability reports with export support.

## Cross-Cutting Requirements
- Feature flags:
  - `USE_REAL_OPS_API`
  - `ENABLE_ALERTING`
  - `ENABLE_SSO`
- Observability:
  - request logging
  - scheduler/job logs
  - error rate/latency metrics
- Reliability:
  - retries with backoff for check failures
  - stale-data detection and UI fallback labels
- Security:
  - secrets via env vars only
  - no provider credentials in frontend
  - strict server-side authorization on all mutation routes

## Test Plan
- Backend unit tests:
  - health normalization rules
  - alert trigger logic
  - incident lifecycle transitions
  - RBAC policy enforcement
- Backend integration tests:
  - API contracts
  - persistence behavior
  - ticket adapter interaction mocks
- Frontend integration tests:
  - dashboard/status rendering from backend payloads
  - incident actions and optimistic/error states
  - role-restricted UI visibility
- E2E smoke path:
  - degraded app -> alert -> incident open -> ticket link -> resolve

## Implementation Order (Recommended)
1. Phase 0 contracts and migrations.
2. Phase 1 real dashboard/status data.
3. Phase 2 incidents + ticket linkage.
4. Phase 3 SSO/RBAC/audit.
5. Phase 4 SLA and exports.

## Assumptions and Defaults
- `apps/poc-api` is the backend base for operations APIs (no separate new backend service).
- SQLite remains default in local/dev; schema remains Postgres-portable.
- Tech Connect is first ticket adapter target.
- Existing design language remains unless design freeze explicitly changes it.
- This plan is implementation-ready but intentionally deferred until design completion.

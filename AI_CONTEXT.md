# AI Context

## Purpose

This file is the canonical repo-memory document for AI agents working in `/Users/austinhowell/Desktop/Howell-Technologies-Portal`.

## Maintenance Rule

- Future agents should update this file whenever they add, remove, or materially change behavior in the portal.
- Future agents should also record important repo discoveries, UX decisions, architectural boundaries, workflow conventions, and implementation lessons here so later sessions can resume with minimal rediscovery.
- Treat this file as the first place to read for repo-specific context before making major changes.

## Current Architecture

- Workspace type: npm workspaces monorepo
- Internal app: `apps/operator-portal`
- Demo consumer: `apps/client-portal-demo`
- Private package: `packages/portal` published as `@howell-technologies/portal`

## Product Intent

### Short Term
- Run an internal Howell Technologies admin portal with mock-auth login from JSON.
- Manage client records and see the current status of client applications.
- Expose a high-visibility dashboard with live, degraded, and down application summaries.
- House a reusable `PortalApp` package that client portals can install through npm/GitHub Packages.

### Long Term
- Grow into an “everything app” for Howell Technologies.
- Support access through a primary website domain, direct links, or embedded experiences.
- Formalize GitHub-based versioning, artifact publishing, and release flow.

## Boundaries

### Parent Howell App Owns
- Internal staff login
- Multi-client oversight
- Application health/status dashboard
- Future operations and ticket visibility

### `@howell-technologies/portal` Owns
- Reusable embedded portal shell
- Host-configurable branding
- Shared types and adapter interfaces
- Optional client-facing modules such as reports and ticket summaries

## Key Implementation Defaults

- v1 uses frontend-only mocks for auth, clients, and app status.
- Ticketing is integration-first, with an adapter boundary rather than a native ticketing backend.
- Branding is config-driven from day one.
- Primary package export is `PortalApp`.
- Operator auth is intentionally in-memory only, so a full page refresh always returns the user to `/login`.

## Current UX Direction

- The admin portal visual direction is now premium and dashboard-first, with the HOG portal used as a style/template reference rather than copying its exact product behavior.
- Branding direction is now Howell logo driven (copper + slate + neutral grays) rather than the earlier teal-heavy palette.
- Login is intentionally streamlined into a single centered glass-panel experience.
- The dashboard is a command-center surface, not a generic CRUD landing page.
- The shell, clients pages, and status pages should continue matching the same premium visual language as the dashboard.
- Primary navigation is now a top menu/header (not a left sidebar), with desktop-first horizontal nav and responsive stacking on smaller screens.
- On desktop, the app is designed to fit the viewport with internal scroll areas where needed; mobile/tablet can fall back to natural page flow.

## Current Deliverables

### Admin Portal
- React + Vite internal operations app exists under `apps/operator-portal`.
- Mock JSON auth is implemented for staff login.
- Protected routes are implemented for:
  - dashboard
  - clients list
  - client detail
  - application status
- Dashboard currently includes:
  - command-center hero
  - live/degraded/down summaries
  - priority incident spotlight
  - portfolio health list
  - operator brief and quick-action rail
- Clients and status pages have been upgraded to match the premium dashboard style.
- Sidebar/nav interactions have been improved with stronger hover, active, focus, and pressed states.

### Reusable Package
- `@howell-technologies/portal` exists under `packages/portal`.
- Primary package export is `PortalApp`.
- The package is host-configurable and intended for client portal embedding, not Howell’s internal oversight dashboard.

### Demo Consumer
- A local consumer app exists under `apps/client-portal-demo` to validate `PortalApp` integration.

## Workflow Conventions

- Root `npm run docker` should build and start the admin portal container in one command.
- `npm run docker` should default to `http://localhost:5173` (via `-p ${PORT:-5173}:80`) so Docker access matches the standard local dev URL pattern.
- `npm run docker` should force-replace the existing `howell-technologies-portal` container name (remove existing, wait until name is free, then run the new container).
- Root `AI_CONTEXT.md` should stay current as implementation progresses.
- The copied Austin AI reference in `docs/reference/AUSTIN-AI.md` remains useful for portal UX inspiration and prior implementation behavior.

## Recent Implementation Notes

### 2026-03-08
- Converted the repo into an npm workspaces monorepo with:
  - operator portal app
  - reusable `PortalApp` package
  - demo consumer app
- Added Docker, NGINX, GitHub Actions CI, and release workflow scaffolding.
- Added root `npm run docker`.
- Added copied Austin AI reference into the repo under `docs/reference/AUSTIN-AI.md`.
- Simplified login to a cleaner HOG-inspired single-panel experience.
- Redesigned the dashboard into a more premium command-center layout.
- Extended that design language to the sidebar, clients page, client detail page, and application status page.
- Updated desktop layout behavior so the app fits the viewport and uses internal scrolling where appropriate.
- Improved left-sidebar button interactions and active-state treatment.
- Updated Docker default host port to `5173` so `npm run docker` serves on the same localhost port pattern as local app runs.
- Updated `npm run docker` to force-replace any existing `howell-technologies-portal` container to avoid name-conflict failures.
- Added Howell logo asset to `apps/operator-portal/src/assets/howell-logo.png` and wired it into login + sidebar brand mark.
- Applied a brand-color CSS token system (`--ht-*`) in `styles.css` based on Howell copper/slate tones and updated key shell/dashboard/login surfaces to use it.
- Converted the operator shell navigation from a left sidebar to a top menu for easier direct access.

## Austin AI Reference

A copied snapshot of the external Austin AI portal context lives at [docs/reference/AUSTIN-AI.md](/Users/austinhowell/Desktop/Howell-Technologies-Portal/docs/reference/AUSTIN-AI.md). Use it as historical/reference context for portal UX and data behavior when extending this repo.

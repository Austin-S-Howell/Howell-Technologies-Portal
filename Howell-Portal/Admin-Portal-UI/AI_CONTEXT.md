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
- Backend API: `apps/poc-api` (FastAPI + SQLite)

## Product Intent

### Short Term
- Run an internal Howell Technologies admin portal with mock-auth login from JSON.
- Manage client records and see the current status of client applications.
- Expose a high-visibility dashboard with live, degraded, and down application summaries.
- House a reusable `PortalApp` package for homepage widgets + Power BI reports + multi-view composition.
- Provide a POC Generator flow for customer demos that uses real package contracts and backend Microsoft/workspace data.

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
- Reusable embedded portal shell focused on homepage widgets + reports
- Host-configurable branding
- Shared types and adapter interfaces
- Multi-view layout rendering for side-by-side report compositions

### `apps/poc-api` Owns
- Microsoft OAuth session callbacks and cookie session lifecycle
- Power BI workspace/report discovery + embed-token generation
- Per-user persisted POC configs and multi-view records in SQLite

## Key Implementation Defaults

- v1 uses frontend-only mocks for auth, clients, and app status.
- POC Generator now uses backend-assisted Microsoft auth + workspace fetches.
- Branding is config-driven from day one.
- Primary package export is `PortalApp`.
- Operator auth is intentionally in-memory only, so a full page refresh always returns the user to `/login`.
- Agents should continue recording every meaningful implementation addition and repo-level discovery in this file.

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
  - demo workbench (`POC Generator`)
- Dashboard currently includes:
  - command-center hero
  - live/degraded/down summaries
  - priority incident spotlight
  - portfolio health list
  - operator brief and quick-action rail
- Clients and status pages have been upgraded to match the premium dashboard style.
- Sidebar/nav interactions have been improved with stronger hover, active, focus, and pressed states.
- `/demo-workbench` is now a `POC Generator`:
  - guided company-input form
  - strict JSON override validation against `CompanyPOCConfig`
  - Microsoft connect action for workspace-scoped report discovery
  - report add/remove selection and generated multi-view layouts
  - live preview through the real `PortalApp`
  - undo/redo + discard-all behavior
  - backend save/load for POC configs + multi-views
  - export artifacts (`POC_CONFIG.json` + `IMPLEMENTATION_BRIEF.md`)

### Reusable Package
- `@howell-technologies/portal` exists under `packages/portal`.
- Primary package export is `PortalApp`.
- Additional helper export: `buildPortalFromConfig(config)`.
- Package scope now intentionally excludes ticket/documents UI and is focused on homepage widgets + reports/multi-views.
- The package remains host-configurable and intended for client portal embedding, not Howell’s internal oversight dashboard.

### Backend API
- `apps/poc-api` exists with:
  - FastAPI routers for auth/reports/poc
  - SQLModel persistence for `UserSession`, `POCConfig`, `POCMultiView`
  - Power BI service integration seams based on HOG connector patterns
  - Alembic scaffolding and initial migration

### Demo Consumer
- A local consumer app exists under `apps/client-portal-demo` to validate `PortalApp` integration.

## Workflow Conventions

- Root `npm run docker` should build and start both FE + BE containers via Docker Compose in one command.
- `npm run docker` should expose:
  - frontend at `http://localhost:5173`
  - backend at `http://localhost:8000`
- Use `npm run docker:frontend` when only the admin portal container is needed.
- Root `npm run docker:api` should build and run `apps/poc-api` on `http://localhost:8000`.
- Root `npm run docker:stack` should run the FE+BE stack via `docker compose`.
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
- Replaced the old Demo Workbench implementation with a POC Generator experience on the same route.
- Simplified POC Generator inputs to only:
  - Microsoft login/connect
  - company name
  - company logo URL
  - company color controls
- Updated POC Generator layout so the `PortalApp` preview is the primary full-window user-view surface.
- Pivoted `@howell-technologies/portal` to homepage widgets + reports + multi-view only.
- Added `buildPortalFromConfig` helper and updated local demo consumer to that contract.
- Added operator portal integration tests for protected `/demo-workbench` route + nav rendering.
- Added `apps/poc-api` FastAPI backend with Microsoft auth endpoints, Power BI routes, and persisted POC/multiview CRUD.
- Added `apps/poc-api` Dockerfile and root `docker-compose.yml` plus npm scripts (`docker:api`, `docker:stack`).
- Updated root `npm run docker` to start the full FE+BE stack (compose) so backend is always available during Docker testing.

### 2026-03-09
- Added backend Microsoft runtime-config endpoints:
  - `GET /api/auth/microsoft/config`
  - `POST /api/auth/microsoft/config`
- Added frontend POC Generator form inputs for Microsoft `clientId`, `tenantId`, and `clientSecret` so auth can be configured from the UI without editing env vars.
- Added frontend API bindings + types for Microsoft runtime config fetch/update.
- Updated POC Generator Microsoft section to:
  - save runtime config
  - show saved-config status
  - keep `Connect Microsoft` disabled until required config is present
- Hardened backend Microsoft auth flow:
  - catches invalid authority/config errors and returns `400` with actionable detail instead of `500`
  - normalizes requested scopes before auth-code flow by filtering reserved scopes (`openid`, `profile`, `offline_access`) to avoid MSAL runtime errors
- Added/updated backend auth tests for Microsoft config set/fetch and callback precondition behavior.
- Practical login requirement note: Microsoft OAuth only succeeds when the entered app registration values are real and aligned (tenant + client + secret + matching redirect URI in Azure app registration).
- POC Generator is now dismissable:
  - `Dismiss Builder` hides controls
  - `Open POC Builder` reopens controls
  - hidden mode gives near-full-screen preview for report testing
- POC Generator logo inputs now support both:
  - direct logo URL paste
  - local image upload (converted to data URL for immediate preview)
  - website-domain shortcut (`Use Website Logo`) that applies a domain-derived logo URL
- `PortalApp` visual language was shifted toward the HOG-style reference:
  - left vertical navigation rail
  - center operations workspace
  - right summary rail
  - cool gray/teal default palette and card treatment to match the provided screenshot direction
- POC flow was simplified to demo-only mode:
  - removed Microsoft login/configuration UI from `/demo-workbench`
  - removed backend-driven report discovery from the POC page
  - kept only local branding/demo controls (company name, logo URL/upload, website-logo shortcut, colors)
  - seeded static reports + multiviews in defaults so report navigation is still demoable without live integrations
- Added a built-in Power BI-style mock stock report renderer for POC preview:
  - when a demo report uses `embedUrl` with `demo://...`, preview renders a styled HTML/CSS report canvas (market KPIs, trend chart, volume bars, watchlist)
  - keeps demos visually close to a real BI experience even without live embed tokens
- Updated default POC demo data to financial/stock-report content (`Stock Market Pulse`, `Sector Rotation Monitor`) for immediate report-style demos.
- Follow-up architecture correction:
  - moved stock-report mock rendering behavior out of `packages/portal` and into `apps/operator-portal` POC builder preview adapter
  - `PortalApp` remains library-generic (no POC/demo-specific renderer logic)
  - POC builder now resolves `demo://...` report URLs into local HTML/CSS mock report documents for iframe preview
- Sidebar visual update for portal demo:
  - company logo moved above the logged-in user card
  - footer now shows company name and a visual-only `Sign Out` button (non-functional by design)
- Additional demo polish:
  - visual `Sign Out` button made smaller/cleaner and updated to use Prime icon classes
  - `primeicons` is loaded in operator app (`main.tsx`) for icon rendering
  - POC initial-state hydration now always pins report/multiview data to seeded demo values, ensuring the hardcoded mock report always appears even with stale localStorage
- Dashboard wording cleanup:
  - removed the `Howell command center` hero title copy and replaced it with `Operations overview` to keep branding text out of the dashboard heading while pages are being reworked
- Logo intelligence updates:
  - POC builder now derives portal theme tokens (`primary`, `accent`, `surface`, `text`, `mutedText`) from uploaded logo image pixels automatically
  - Portal logo frame now adapts to logo aspect ratio:
    - wider logos render in a wider frame
    - tall logos are constrained to square presentation
- Login page refinement:
  - simplified login UX to a single centered `Login` action using the seeded mock admin credentials
  - email/password inputs are visible again and required for sign-in
  - login submits typed credentials against mock auth records in `apps/operator-portal/src/data/users.json`
  - invalid credential attempts now surface user-friendly copy: `Incorrect email/password combination`
  - cleaned login visual style with a softer gradient background, tighter panel spacing, and centered action/error treatment
  - login-page background gradient is now explicitly orange-to-gray for clearer brand contrast
- Custom loading spinner (operator app only):
  - added internal `HowellLogoSpinner` component with a handcrafted Howell-style emblem center and animated orange-to-gray orbit/fill arc (no direct image asset in spinner)
  - wired spinner into login submit state and dashboard initial loading state
  - added reduced-motion fallback (`prefers-reduced-motion`) that disables spinner animation while keeping indicator visible
  - spinner animation now rotates only the brown/gray logo ring itself; the prior outer loading ring was removed
- Simulated loading timing:
  - added a shared `waitForSimulatedDelay()` helper in operator services with a 3-second delay
  - delay is applied to mock `login()` and `getDashboardSnapshot()` so the custom spinner is visible on login and first app dashboard load
  - delay is automatically skipped in test runtime (`MODE === test` / `VITEST`) to keep test runs fast
  - login loading UX now uses a full-page blurred overlay with centered spinner; spinner is no longer embedded inside the login button

## Finalized Approved UX (Current Preference)

### Login + Loading (Locked)
- Keep email/password inputs visible on login; validate against `apps/operator-portal/src/data/users.json` mock credentials.
- For invalid credentials, always show: `Incorrect email/password combination`.
- Login page background should remain orange-to-gray gradient.
- During login submit, show a full-page loading overlay with background blur and centered custom spinner.
- Do not render spinner inside the login button.

### Spinner Design (Locked)
- Spinner is operator-portal only and implemented by `apps/operator-portal/src/components/HowellLogoSpinner.tsx`.
- Do not use the raw logo image in the spinner.
- Spinner center must be a handcrafted Howell-style SVG emblem (H/T + internal ring).
- Loading animation must rotate the brown/gray logo ring itself.
- Spinner `H` glyph should omit the left vertical stroke to better match the original Howell logo mark.
- Spinner half-`H` horizontal stroke is intentionally extended left to remove visible gap against the inner ring.
- Do not use a separate outer loading ring.
- Keep reduced-motion support (`prefers-reduced-motion`) so animation stops cleanly.

### Reimplementation Checklist
- `HowellLogoSpinner` SVG + ring rotation styles: `apps/operator-portal/src/components/HowellLogoSpinner.tsx` and `apps/operator-portal/src/styles.css`.
- Login overlay behavior: `apps/operator-portal/src/pages/LoginPage.tsx` + `.login-loading-overlay` and `.login-page--busy` styles.
- Simulated demo delay: `apps/operator-portal/src/services/simulatedDelay.ts` used by `login()` and `getDashboardSnapshot()`.
- Preserve test speed by skipping simulated delay in Vitest runtime.
- Cleanup note:
  - removed stale login CSS selectors that were no longer used after overlay-spinner refactor (`.login-submit__content`, button-scoped spinner label override, `.login-note`).
- Build/version display:
  - dashboard now shows build badge using `apps/operator-portal/src/config/buildVersion.ts`.
  - top header brand subtitle now shows `Admin Portal | BUILD Vx.y.z`.
  - source of truth is `OPERATOR_PORTAL_BUILD_VERSION`.
  - root `build.js` manages semver bumps:
    - `major` => x.0.0
    - `minor` => 0.x.0
    - `patch` => 0.0.x
  - npm shortcuts:
    - `npm run build:version`
    - `npm run build:version:major`
    - `npm run build:version:minor`
    - `npm run build:version:patch`

## Deferred Build Roadmap

- Post-design implementation roadmap is now documented in:
  - `docs/OPERATIONS_PORTAL_IMPLEMENTATION_PLAN.md`
- This roadmap is intentionally deferred until design freeze and includes phased execution for:
  - real health ingestion + dashboard backend data
  - alerts/incidents/ticket linkage
  - SSO/RBAC/audit
  - SLA reporting and exports
- Current backend scope note:
  - `apps/poc-api` still contains Microsoft auth + Power BI report routes/services, but current operator portal runtime no longer consumes those endpoints.
  - `apps/operator-portal/src/poc/api.ts` currently exports Microsoft/Power BI fetch helpers that are not imported by current UI pages.

## Restructure Repair Notes

- Repo was restructured into:
  - `Howell-Portal/Admin-Portal-UI`
  - `Howell-Portal/Portal-Library`
  - `Howell-Portal/Admin-Portal-BE`
- Type-check/build break in operator app after restructure was fixed by adding `@testing-library/jest-dom` to `apps/operator-portal/tsconfig.json` types.
- `Portal-Library` standalone project was repaired:
  - corrected `tsconfig.json` extends/paths to point at `../Admin-Portal-UI`
  - corrected `vite.config.ts` alias to local portal package path
  - added missing local dev toolchain dependencies (`typescript`, `vite`, `vitest`, testing libs, React type defs)
  - switched `@howell-technologies/portal` dependency to local file reference: `file:../Admin-Portal-UI/packages/portal`
- Docker path fixes after restructure:
  - `docker-compose.yml` `poc-api` build context now points to `../Admin-Portal-BE/poc-api`
  - root UI `package.json` `docker:api` script now builds from `../Admin-Portal-BE/poc-api`
  - UI `Dockerfile` removed stale `COPY apps/client-portal-demo/package.json ...` line (path no longer exists in Admin-Portal-UI split)
- Additional Docker/backend hardening:
  - `Admin-Portal-BE/poc-api/Dockerfile` now installs from `requirements.txt` rather than `pip install .` to avoid pyproject packaging metadata issues during image build.
  - Added `Admin-Portal-BE/poc-api/requirements.txt` with runtime backend dependencies.
  - Updated `Admin-Portal-BE/poc-api/README.md` local run path to the new restructured location.
- Script/path cleanup:
  - `Admin-Portal-UI/package.json` `dev:demo` now points to `../Portal-Library` (`npm --prefix ../Portal-Library run dev`) instead of missing workspace path.
- Validation now passes for:
  - `Admin-Portal-UI`: `npm run lint`, `npm run test`, `npm run build`
  - `Portal-Library`: `npm run lint`, `npm run test`, `npm run build`
  - `Admin-Portal-BE/poc-api`: tests pass with Python 3.13 using `/opt/miniconda3/bin/python3 -m pytest -q` (9 passed; FastAPI `on_event` deprecation warnings only).
  - Docker stack validation: `npm run docker` from `Admin-Portal-UI` now builds and starts both containers successfully (`howell-technologies-portal`, `howell-technologies-poc-api`).

## Austin AI Reference

A copied snapshot of the external Austin AI portal context lives at [docs/reference/AUSTIN-AI.md](/Users/austinhowell/Desktop/Howell-Technologies-Portal/docs/reference/AUSTIN-AI.md). Use it as historical/reference context for portal UX and data behavior when extending this repo.

## Mobile + App Icon Decisions (Latest)

- Operator portal now uses separate shell components for desktop and mobile so styles/layout behavior are isolated:
  - desktop shell: `apps/operator-portal/src/layouts/DesktopAppShell.tsx`
  - mobile shell: `apps/operator-portal/src/layouts/MobileAppShell.tsx`
  - shell switcher: `apps/operator-portal/src/layouts/AppShell.tsx` using viewport query `(max-width: 980px)`
- Mobile styling is isolated in its own stylesheet:
  - `apps/operator-portal/src/styles.mobile.css`
  - desktop/general styles remain in `apps/operator-portal/src/styles.css`
- Mobile shell behavior:
  - dedicated mobile header + compact user row
  - mobile tab navigation with icons (Home, Clients, Status, POC)
  - mobile tabs are anchored at the bottom of the viewport (fixed bottom tab bar)
  - active tab is visually highlighted and has subtle up/down motion feedback for page awareness
  - mobile tab UX is now touch-optimized with smoother micro-interactions (tap scaling, icon capsule state, and elevated active state)
  - mobile content area now uses momentum scrolling (`-webkit-overflow-scrolling: touch`) and overscroll containment for app-like behavior
  - mobile route transitions now have subtle content entry animation for a more native app feel
  - safe-area handling improved for top and bottom insets (`env(safe-area-inset-top/bottom)`)
  - scrollable mobile content pane inside full-height layout
- mobile header no longer renders the old name/role strip below the header
- header now has avatar + sign-out actions on the right
- avatar routes to profile settings (`/profile`)
- mobile bottom nav now includes a `Profile` tab (mobile shell only)
- mobile logo alignment in the top-left brand mark was adjusted for better centering
- mobile layout overlap fix:
  - mobile shell now uses non-overlapping rows (`header`, `content`, `bottom nav`) so content is not covered by header/nav.
  - bottom tab bar now uses equal-width flex tabs with clipped labels to prevent right-edge overflow/off-screen tabs.
- iPhone install prompt:
  - added mobile Safari/iPhone-only install prompt in `MobileAppShell`.
  - prompt appears only when not already installed as standalone and if not recently dismissed.
  - includes `Install` (shows Add-to-Home-Screen steps) and `Not now`.
  - `Not now` stores dismissal in localStorage for 7 days (`howell.mobile.installPromptDismissedAt.v1`).
- Mobile background polish:
  - mobile viewport (`html`, `body`, `#root`) now uses branded gradient background to avoid white bands at top/bottom.
  - mobile header and bottom nav backgrounds were retuned to darker branded surfaces to keep color continuity.
  - mobile content pane uses a soft tinted surface while keeping full-shell non-scroll viewport behavior.
- Profile page:
  - added `apps/operator-portal/src/pages/ProfileSettingsPage.tsx`
  - route added at `/profile`
  - page shows operator identity details (name, email, role, user ID, build label)
- Client environment detection:
  - added `apps/operator-portal/src/utils/clientEnvironment.ts` for centralized mobile/desktop + browser-family detection.
  - app shell now combines viewport + UA/touch heuristics to classify device profile (`mobile` or `desktop`).
  - runtime identifiers are written to document root for inspection/styling hooks:
    - `data-ht-device` (`mobile`/`desktop`)
    - `data-ht-browser` (`chrome`/`safari`/`firefox`/`edge`/`opera`/`samsung-internet`/`unknown`)
    - `data-ht-input` (`touch`/`pointer`)
- Browser/app branding updates for operator portal:
  - tab title set to `HT Portal`
  - favicon uses Howell logo
  - iOS add-to-home title set to `HT Portal`
  - apple-touch-icon and web manifest are wired in `apps/operator-portal/index.html`
  - generated icon assets live in `apps/operator-portal/public/`
    - `favicon-16x16.png`
    - `favicon-32x32.png`
    - `apple-touch-icon.png`
    - `android-chrome-192x192.png`
    - `android-chrome-512x512.png`
    - `howell-logo.png`
    - `site.webmanifest`

## GitHub Pages Deploy (Manual)

- Added a manual deploy workflow at repo root:
  - `.github/workflows/deploy-operator-portal-pages.yml`
- Trigger mode: `workflow_dispatch` only (manual run from Actions tab).
- Workflow input:
  - `use_custom_domain` (boolean, default `false`)
  - when `true`, deploy includes `CNAME` for `portal.howelltechnologies.com`
  - when `false`, deploy omits `CNAME` so default GitHub Pages URL works before DNS is ready
  - `static_fe_only` (boolean, default `true`)
  - when `true`, workflow writes `apps/operator-portal/.env.production.local` with:
    - `VITE_STATIC_FE_ONLY=true`
    - `VITE_POC_API_BASE_URL=`
  - when `false`, workflow writes `VITE_STATIC_FE_ONLY=false` for backend-integrated builds
- Deployment target: GitHub Pages environment using Actions artifact upload/deploy.
- Build target is only operator portal:
  - run from `Howell-Portal/Admin-Portal-UI`
  - command: `npm run build --workspace @howell-technologies/operator-portal`
- Pages artifact path:
  - `Howell-Portal/Admin-Portal-UI/apps/operator-portal/dist`
- Custom domain support:
  - added `apps/operator-portal/public/CNAME` with `portal.howelltechnologies.com`
  - workflow includes a guard step to ensure `dist/CNAME` exists before upload.
- Frontend backend-guard behavior:
  - `apps/operator-portal/src/poc/api.ts` now checks `VITE_STATIC_FE_ONLY`.
  - When static-only is enabled, backend API helper calls fail fast with clear error text instead of attempting network requests.
- Workflow stability fix:
  - replaced heredoc env-file write in deploy workflow with `printf` writes to avoid GitHub runner heredoc parsing failures (`unexpected end of file`).
- GitHub Pages subpath fix:
  - deploy workflow now sets `VITE_PUBLIC_BASE` dynamically:
    - custom domain on: `/`
    - custom domain off: `/${{ github.event.repository.name }}/`
  - operator portal Vite config now reads `VITE_PUBLIC_BASE` via `loadEnv` and applies it to `base`.
  - operator portal router now uses `BrowserRouter` basename from `import.meta.env.BASE_URL`.
  - `index.html` icon/manifest links use `%BASE_URL%...` so assets resolve in both root and repo-subpath deployments.
  - `site.webmanifest` now uses relative paths and `start_url: "."` for subpath compatibility.
  - deploy workflow now copies `dist/index.html` to `dist/404.html` for SPA route refresh support on GitHub Pages.
  - deploy workflow removes `dist/CNAME` when `use_custom_domain=false` to prevent forced redirect to an unset custom domain.
- Documentation refresh:
  - added repo-root `README.md` with Howell logo, accurate platform overview, current folder structure, local dev commands, and GitHub Pages deployment guidance.

<p align="center">
  <img src="Howell-Portal/Admin-Portal-UI/apps/operator-portal/public/howell-logo.png" alt="Howell Technologies Logo" width="190" />
</p>

# Howell Technologies Portal Platform

Internal and client-facing portal platform for Howell Technologies.

This repository contains:

- The Howell **Admin Portal** for internal operations (clients, app status visibility, and demo/POC experiences).
- The reusable **portal library** used to power client portal experiences.
- An optional **Python API** service used for extended integrations and persistence workflows.

## Repository Structure

| Path | Purpose |
| --- | --- |
| `Howell-Portal/Admin-Portal-UI` | Main frontend workspace (operator portal + reusable `@howell-technologies/portal` package). |
| `Howell-Portal/Portal-Library` | Standalone local library/demo workspace for portal-library development workflows. |
| `Howell-Portal/Admin-Portal-BE/poc-api` | FastAPI backend for optional POC/integration APIs. |

## Primary Product Direction

- **Operator Portal** is the internal control center for Howell Technologies staff.
- **Portal library (`PortalApp`)** is the embeddable client portal runtime.
- **POC Generator** in the operator portal is used for demoing portal capabilities.
- GitHub Pages deployment supports **static frontend-only** mode for easy public demo hosting.

## Local Development

From the main UI workspace:

```bash
cd Howell-Portal/Admin-Portal-UI
npm install
npm run dev
```

Common scripts:

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run smoke`
- `npm run docker`

## GitHub Pages Deployment (Manual)

This repo includes a manual GitHub Actions workflow:

- Workflow: `Deploy Operator Portal (Pages)`
- Trigger: `workflow_dispatch`
- Key inputs:
  - `static_fe_only` (default `true`)
  - `use_custom_domain` (default `false`)

Default Pages URL before DNS/custom domain setup:

- `https://austin-s-howell.github.io/Howell-Technologies-Portal/`

Custom domain target when enabled:

- `https://portal.howelltechnologies.com`

## Branding

Howell branding assets used by the operator portal are located at:

- `Howell-Portal/Admin-Portal-UI/apps/operator-portal/public/`


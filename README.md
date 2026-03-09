# Howell Technologies Portal

Monorepo for two related products:

- `apps/operator-portal`: the internal Howell Technologies admin portal used to monitor client application health, client records, and embedded portal access.
- `packages/portal`: the reusable private npm package published as `@howell-technologies/portal`, exposing `<PortalApp />` for client-facing portal embeds.

## Workspace Commands

```bash
npm install
npm run dev
npm run dev:demo
npm run build
npm run test
```

## App Entrypoints

- Admin portal: `apps/operator-portal`
- Client portal demo consumer: `apps/client-portal-demo`
- Reusable package: `packages/portal`

## Docker

Build the admin portal image from the repo root:

```bash
docker build -t howell-technologies-portal .
docker run -p 5173:80 howell-technologies-portal
```

Or use the repo script:

```bash
npm run docker
```

By default, `npm run docker` publishes the container at `http://localhost:5173` (override with `PORT=xxxx npm run docker`).

## CI/CD

- Pull requests run install, build, and test checks.
- Release tags publish `@howell-technologies/portal` to GitHub Packages and build a container image for the admin portal.

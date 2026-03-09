# Portal Library

`Portal-Library` is now the reusable client portal package.

Its job is:

- provide the shared authenticated portal shell and branding surface
- let client repos render their own application content inside that shell
- optionally report portal heartbeat/state back to Howell for operator monitoring

It does not own report generation or report embedding.

## Main exports

- `PortalShell`
- `PortalPanel`
- `PortalStatusBadge`
- `usePortalHeartbeat`
- `createPortalStatusReporter`

## Install/use shape

```tsx
import { PortalPanel, PortalShell } from "@howell-technologies/portal-library";

export function ClientPortal() {
  return (
    <PortalShell
      branding={{ companyName: "Acme", theme: { primary: "#22384a" } }}
      session={{ id: "u1", name: "Alex Admin", email: "alex@acme.example" }}
      headline="Acme Portal"
      subheadline="Client-owned content inside the shared shell."
      monitoring={{
        endpoint: "https://howell-api.example.com/api/runtime-status/heartbeat",
        clientId: "acme",
        applicationId: "acme-portal",
        portalName: "Acme Portal",
      }}
    >
      <PortalPanel eyebrow="Welcome" title="Client content">
        <p>Your app decides what renders here.</p>
      </PortalPanel>
    </PortalShell>
  );
}
```

## Monitoring contract

If `monitoring` is configured, the package can send regular heartbeats to Howell's backend.

Expected backend endpoint:

- `POST /api/runtime-status/heartbeat`

Useful monitoring fields:

- `clientId`
- `applicationId`
- `portalName`
- `status`
- `responseTimeMs`
- `currentPath`
- `buildVersion`

If heartbeats stop arriving, the Howell admin portal can treat the portal as down/stale.

Cloud Run example:

- `endpoint: "https://YOUR_CLOUD_RUN_SERVICE_URL/api/runtime-status/heartbeat"`

## Local commands

- `npm run dev`
- `npm run build`
- `npm test`

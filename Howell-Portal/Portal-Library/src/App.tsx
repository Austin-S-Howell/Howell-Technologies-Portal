import { PortalPanel, PortalShell, PortalStatusBadge } from "./index";
import { portalDemoBranding, portalDemoNavigation, portalDemoSession } from "./portalDemoConfig";

export default function App() {
  return (
    <main style={{ padding: 32, minHeight: "100vh", background: "#edf5fa" }}>
      <PortalShell
        branding={portalDemoBranding}
        session={portalDemoSession}
        navigation={portalDemoNavigation}
        headline="Riverbend Care Hub"
        subheadline="A reusable portal shell package for authenticated client experiences."
        statusMessage="Runtime heartbeat reporting is package-driven and report rendering stays in the client app."
        rightRail={
          <PortalPanel eyebrow="Package intent" title="Client-owned content">
            <div style={{ display: "grid", gap: 10, color: "#5a6470" }}>
              <p style={{ margin: 0 }}>
                This package provides the shell, theming, and runtime heartbeat. Riverbend owns the app content and any report
                integrations.
              </p>
              <PortalStatusBadge state="live" label="Preview ready" />
            </div>
          </PortalPanel>
        }
      >
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 1fr)" }}>
          <PortalPanel eyebrow="Portal modules" title="Current authenticated view">
            <div style={{ display: "grid", gap: 10 }}>
              <div style={demoRowStyle()}>
                <strong>Member directory</strong>
                <span>Client-owned module</span>
              </div>
              <div style={demoRowStyle()}>
                <strong>Operational alerts</strong>
                <span>Client-owned module</span>
              </div>
              <div style={demoRowStyle()}>
                <strong>Knowledge center</strong>
                <span>Client-owned module</span>
              </div>
            </div>
          </PortalPanel>

          <PortalPanel eyebrow="Howell monitoring" title="Admin relay">
            <div style={{ display: "grid", gap: 10, color: "#5a6470" }}>
              <p style={{ margin: 0 }}>
                The package can post heartbeats to Howell so the operator portal can see whether this client portal is still
                responding.
              </p>
              <PortalStatusBadge state="degraded" label="Example degraded state" />
            </div>
          </PortalPanel>
        </div>
      </PortalShell>
    </main>
  );
}

function demoRowStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d4dae3",
    background: "#edf3f6",
  };
}

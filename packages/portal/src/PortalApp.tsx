import { useEffect, useMemo, useState } from "react";
import type {
  PortalAppProps,
  PortalContent,
  PortalDocumentItem,
  PortalFeatures,
  PortalReportItem,
  PortalSession,
  PortalTicketSummary,
  PortalView,
} from "./types";

const DEFAULT_VIEW: PortalView = "overview";

function getViewFromLocation(basePath: string): PortalView {
  if (typeof window === "undefined") {
    return DEFAULT_VIEW;
  }

  const suffix = window.location.pathname.replace(basePath, "").replace(/^\/+/, "");
  const [candidate] = suffix.split("/");

  if (candidate === "reports" || candidate === "tickets" || candidate === "documents") {
    return candidate;
  }

  return DEFAULT_VIEW;
}

function pushView(basePath: string, view: PortalView) {
  if (typeof window === "undefined") {
    return;
  }

  const nextPath = view === DEFAULT_VIEW ? basePath : `${basePath}/${view}`;
  window.history.pushState({}, "", nextPath);
}

function getTheme(props: PortalAppProps["branding"]) {
  return {
    primary: props.theme?.primary ?? "#1d5f9a",
    surface: props.theme?.surface ?? "#f4f8fb",
    accent: props.theme?.accent ?? "#d4e8f8",
    text: props.theme?.text ?? "#152230",
    mutedText: props.theme?.mutedText ?? "#587185",
  };
}

function panelToneColor(tone?: "positive" | "neutral" | "warning") {
  if (tone === "positive") {
    return "#11845b";
  }
  if (tone === "warning") {
    return "#b25b19";
  }
  return "#4b6275";
}

export function PortalApp({
  branding,
  features = {},
  adapter,
  session: sessionProp,
  basePath = "/portal",
}: PortalAppProps) {
  const [session, setSession] = useState<PortalSession | null>(sessionProp ?? null);
  const [content, setContent] = useState<PortalContent | null>(null);
  const [reports, setReports] = useState<PortalReportItem[]>([]);
  const [ticketSummary, setTicketSummary] = useState<PortalTicketSummary | null>(null);
  const [documents, setDocuments] = useState<PortalDocumentItem[]>([]);
  const [view, setView] = useState<PortalView>(() => getViewFromLocation(basePath));
  const [loading, setLoading] = useState(true);

  const theme = useMemo(() => getTheme(branding), [branding]);
  const resolvedFeatures: Required<PortalFeatures> = {
    reports: Boolean(features.reports),
    tickets: Boolean(features.tickets),
    documents: Boolean(features.documents),
  };

  useEffect(() => {
    function syncFromPopstate() {
      setView(getViewFromLocation(basePath));
    }

    if (typeof window !== "undefined") {
      window.addEventListener("popstate", syncFromPopstate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("popstate", syncFromPopstate);
      }
    };
  }, [basePath]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const nextSession = sessionProp ?? (await adapter.auth.getSession());
      const nextContent = await adapter.portalData.getContent();
      const nextReports =
        resolvedFeatures.reports && adapter.reports ? await adapter.reports.getReports() : [];
      const nextTicketSummary =
        resolvedFeatures.tickets && adapter.tickets ? await adapter.tickets.getTicketSummary() : null;
      const nextDocuments =
        resolvedFeatures.documents && adapter.documents ? await adapter.documents.getDocuments() : [];

      if (!mounted) {
        return;
      }

      setSession(nextSession);
      setContent(nextContent);
      setReports(nextReports.length ? nextReports : nextContent.reports ?? []);
      setTicketSummary(nextTicketSummary ?? nextContent.ticketSummary ?? null);
      setDocuments(nextDocuments.length ? nextDocuments : nextContent.documents ?? []);
      setLoading(false);
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [adapter, resolvedFeatures.documents, resolvedFeatures.reports, resolvedFeatures.tickets, sessionProp]);

  const navigation = [
    { id: "overview" as const, label: "Overview" },
    ...(resolvedFeatures.reports ? [{ id: "reports" as const, label: "Reports" }] : []),
    ...(resolvedFeatures.tickets ? [{ id: "tickets" as const, label: "Tickets" }] : []),
    ...(resolvedFeatures.documents ? [{ id: "documents" as const, label: "Documents" }] : []),
  ];

  const rootStyle = {
    color: theme.text,
    background: `linear-gradient(160deg, ${theme.surface} 0%, #ffffff 60%)`,
    minHeight: "100%",
    fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
    borderRadius: 28,
    border: `1px solid ${theme.accent}`,
    boxShadow: "0 18px 40px rgba(14, 32, 48, 0.08)",
    overflow: "hidden",
  } satisfies React.CSSProperties;

  if (loading || !content) {
    return (
      <section style={{ ...rootStyle, padding: 32 }}>
        <p style={{ margin: 0, color: theme.mutedText }}>Loading portal experience...</p>
      </section>
    );
  }

  return (
    <section style={rootStyle}>
      <div
        style={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, #0d2a43 100%)`,
          color: "#f8fbfd",
          padding: 32,
          display: "grid",
          gap: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <span style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75 }}>
              {branding.companyName}
            </span>
            <div>
              <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>{content.headline}</h1>
              <p style={{ margin: "12px 0 0", maxWidth: 640, color: "rgba(248, 251, 253, 0.78)" }}>
                {content.subheadline}
              </p>
            </div>
          </div>
          <div
            style={{
              minWidth: 260,
              padding: 20,
              borderRadius: 20,
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.75 }}>
              Signed in
            </p>
            <strong style={{ display: "block", marginTop: 10, fontSize: 20 }}>{session?.name ?? "Portal User"}</strong>
            <span style={{ display: "block", marginTop: 8, color: "rgba(248, 251, 253, 0.78)" }}>
              {session?.email ?? "No session email provided"}
            </span>
            {branding.tagLine ? <p style={{ margin: "18px 0 0" }}>{branding.tagLine}</p> : null}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {navigation.map((item) => {
            const active = item.id === view;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  pushView(basePath, item.id);
                }}
                style={{
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 999,
                  padding: "12px 18px",
                  background: active ? "#f8fbfd" : "rgba(255, 255, 255, 0.12)",
                  color: active ? theme.primary : "#f8fbfd",
                  fontWeight: 700,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: 32, display: "grid", gap: 24 }}>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          {content.metrics.map((metric) => (
            <article
              key={metric.id}
              style={{
                padding: 20,
                background: "#ffffff",
                borderRadius: 20,
                border: `1px solid ${theme.accent}`,
              }}
            >
              <p style={{ margin: 0, color: theme.mutedText, fontSize: 14 }}>{metric.label}</p>
              <strong style={{ display: "block", marginTop: 10, fontSize: 32 }}>{metric.value}</strong>
              {metric.trend ? (
                <span style={{ color: panelToneColor(metric.tone), fontWeight: 600 }}>{metric.trend}</span>
              ) : null}
            </article>
          ))}
        </div>

        <article
          style={{
            padding: 24,
            borderRadius: 24,
            background: "#ffffff",
            border: `1px solid ${theme.accent}`,
          }}
        >
          <p style={{ margin: 0, color: theme.mutedText, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Live status
          </p>
          <h2 style={{ margin: "10px 0 0", fontSize: 28 }}>{content.statusMessage}</h2>
        </article>

        {view === "overview" ? <OverviewPanel content={content} theme={theme} /> : null}
        {view === "reports" ? <ReportsPanel reports={reports} theme={theme} /> : null}
        {view === "tickets" ? <TicketsPanel summary={ticketSummary} theme={theme} /> : null}
        {view === "documents" ? <DocumentsPanel documents={documents} theme={theme} /> : null}
      </div>
    </section>
  );
}

function OverviewPanel({
  content,
  theme,
}: {
  content: PortalContent;
  theme: ReturnType<typeof getTheme>;
}) {
  return (
    <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      <article style={cardStyle(theme)}>
        <p style={eyebrowStyle(theme)}>Announcements</p>
        {content.announcements?.length ? (
          <ul style={{ margin: "16px 0 0", paddingLeft: 20, display: "grid", gap: 10 }}>
            {content.announcements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: "16px 0 0", color: theme.mutedText }}>No announcements available.</p>
        )}
      </article>
      <article style={cardStyle(theme)}>
        <p style={eyebrowStyle(theme)}>Support</p>
        {content.supportPanel ?? (
          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <p style={{ margin: 0, color: theme.mutedText }}>
              Support integrations can render here through the adapter contract.
            </p>
          </div>
        )}
      </article>
    </div>
  );
}

function ReportsPanel({
  reports,
  theme,
}: {
  reports: PortalReportItem[];
  theme: ReturnType<typeof getTheme>;
}) {
  return (
    <article style={cardStyle(theme)}>
      <p style={eyebrowStyle(theme)}>Reports</p>
      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {reports.length ? (
          reports.map((report) => (
            <div key={report.id} style={listItemStyle(theme)}>
              <div>
                <strong>{report.name}</strong>
                <p style={{ margin: "6px 0 0", color: theme.mutedText }}>{report.description}</p>
              </div>
              <span style={{ color: theme.mutedText }}>Updated {report.lastUpdated}</span>
            </div>
          ))
        ) : (
          <p style={{ margin: 0, color: theme.mutedText }}>Reports are not configured for this portal yet.</p>
        )}
      </div>
    </article>
  );
}

function TicketsPanel({
  summary,
  theme,
}: {
  summary: PortalTicketSummary | null;
  theme: ReturnType<typeof getTheme>;
}) {
  return (
    <article style={cardStyle(theme)}>
      <p style={eyebrowStyle(theme)}>Tickets</p>
      {summary ? (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <div style={listItemStyle(theme)}>
            <strong>{summary.provider}</strong>
            <span style={{ color: theme.mutedText }}>Last synced {summary.lastUpdated}</span>
          </div>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <div style={pillCardStyle(theme)}>
              <span>Open tickets</span>
              <strong>{summary.openCount}</strong>
            </div>
            <div style={pillCardStyle(theme)}>
              <span>Urgent tickets</span>
              <strong>{summary.urgentCount}</strong>
            </div>
          </div>
          {summary.href ? (
            <a href={summary.href} style={{ color: theme.primary, fontWeight: 700 }}>
              Open ticketing platform
            </a>
          ) : null}
        </div>
      ) : (
        <p style={{ margin: "16px 0 0", color: theme.mutedText }}>No ticketing provider has been configured.</p>
      )}
    </article>
  );
}

function DocumentsPanel({
  documents,
  theme,
}: {
  documents: PortalDocumentItem[];
  theme: ReturnType<typeof getTheme>;
}) {
  return (
    <article style={cardStyle(theme)}>
      <p style={eyebrowStyle(theme)}>Documents</p>
      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {documents.length ? (
          documents.map((document) => (
            <div key={document.id} style={listItemStyle(theme)}>
              <div>
                <strong>{document.title}</strong>
                <p style={{ margin: "6px 0 0", color: theme.mutedText }}>{document.summary}</p>
              </div>
              {document.href ? (
                <a href={document.href} style={{ color: theme.primary, fontWeight: 700 }}>
                  Open
                </a>
              ) : null}
            </div>
          ))
        ) : (
          <p style={{ margin: 0, color: theme.mutedText }}>No documents are available for this portal yet.</p>
        )}
      </div>
    </article>
  );
}

function cardStyle(theme: ReturnType<typeof getTheme>) {
  return {
    padding: 24,
    borderRadius: 24,
    background: "#ffffff",
    border: `1px solid ${theme.accent}`,
  } satisfies React.CSSProperties;
}

function listItemStyle(theme: ReturnType<typeof getTheme>) {
  return {
    padding: 16,
    borderRadius: 18,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    background: theme.surface,
  } satisfies React.CSSProperties;
}

function pillCardStyle(theme: ReturnType<typeof getTheme>) {
  return {
    padding: 16,
    borderRadius: 18,
    display: "grid",
    gap: 8,
    background: theme.surface,
  } satisfies React.CSSProperties;
}

function eyebrowStyle(theme: ReturnType<typeof getTheme>) {
  return {
    margin: 0,
    color: theme.mutedText,
    fontSize: 14,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  };
}

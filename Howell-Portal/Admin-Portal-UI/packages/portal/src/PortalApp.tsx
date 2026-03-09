import { useEffect, useMemo, useState } from "react";
import type {
  MultiViewConfig,
  PowerBIEmbedInfo,
  PowerBIReportRef,
  PortalAppProps,
  PortalContent,
  PortalFeatures,
  PortalSession,
  PortalView,
} from "./types";

const DEFAULT_VIEW: PortalView = "overview";

function getViewFromLocation(basePath: string): PortalView {
  if (typeof window === "undefined") {
    return DEFAULT_VIEW;
  }

  const suffix = window.location.pathname.replace(basePath, "").replace(/^\/+/, "");
  return suffix.startsWith("reports") ? "reports" : "overview";
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
    primary: props.theme?.primary ?? "#0d677e",
    surface: props.theme?.surface ?? "#d5dde2",
    accent: props.theme?.accent ?? "#c5ced5",
    text: props.theme?.text ?? "#193543",
    mutedText: props.theme?.mutedText ?? "#4e6c7b",
  };
}

function shadeHexColor(hexColor: string, percent: number) {
  const normalized = hexColor.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return hexColor;
  }
  const channel = (offset: number) => parseInt(normalized.slice(offset, offset + 2), 16);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const adjust = (value: number) => clamp(Math.round(value + (percent / 100) * 255));
  const toHex = (value: number) => adjust(value).toString(16).padStart(2, "0");
  return `#${toHex(channel(0))}${toHex(channel(2))}${toHex(channel(4))}`;
}

function initialsFromName(name: string | undefined) {
  if (!name) {
    return "PU";
  }
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PortalApp({
  branding,
  features = {},
  adapter,
  session: sessionProp,
  basePath = "/portal",
}: PortalAppProps) {
  const [session, setSession] = useState<PortalSession | null>(sessionProp ?? null);
  const [logoAspectRatio, setLogoAspectRatio] = useState(1);
  const [content, setContent] = useState<PortalContent | null>(null);
  const [reports, setReports] = useState<PowerBIReportRef[]>([]);
  const [multiViews, setMultiViews] = useState<MultiViewConfig[]>([]);
  const [selectedReport, setSelectedReport] = useState<PowerBIReportRef | null>(null);
  const [selectedMultiView, setSelectedMultiView] = useState<MultiViewConfig | null>(null);
  const [embedInfo, setEmbedInfo] = useState<PowerBIEmbedInfo | null>(null);
  const [embedError, setEmbedError] = useState("");
  const [view, setView] = useState<PortalView>(() => getViewFromLocation(basePath));
  const [loading, setLoading] = useState(true);

  const theme = useMemo(() => getTheme(branding), [branding]);
  const logoLayout = useMemo(() => {
    if (logoAspectRatio > 1.25) {
      const frameHeight = 72;
      const frameWidth = Math.min(176, Math.max(124, Math.round(frameHeight * logoAspectRatio + 10)));
      return {
        frameWidth,
        frameHeight,
        imageWidth: frameWidth - 22,
        imageHeight: frameHeight - 18,
        borderRadius: 14,
      };
    }

    return {
      frameWidth: 84,
      frameHeight: 84,
      imageWidth: 66,
      imageHeight: 66,
      borderRadius: 16,
    };
  }, [logoAspectRatio]);
  const resolvedFeatures: Required<PortalFeatures> = {
    reports: Boolean(features.reports),
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
      const nextMultiViews =
        resolvedFeatures.reports && adapter.reports?.getMultiViews ? await adapter.reports.getMultiViews() : [];

      if (!mounted) {
        return;
      }

      setSession(nextSession);
      setContent(nextContent);
      setReports(nextReports);
      setMultiViews(nextMultiViews);
      setSelectedReport(nextReports[0] ?? null);
      setSelectedMultiView(null);
      setEmbedInfo(null);
      setEmbedError("");
      setLoading(false);
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [adapter, resolvedFeatures.reports, sessionProp]);

  useEffect(() => {
    let cancelled = false;

    async function loadEmbed() {
      if (!selectedReport || !adapter.powerBI) {
        setEmbedInfo(null);
        setEmbedError("");
        return;
      }
      try {
        const info = await adapter.powerBI.getEmbedInfo({
          reportId: selectedReport.reportId,
          groupId: selectedReport.groupId,
        });
        if (!cancelled) {
          setEmbedInfo(info);
          setEmbedError("");
        }
      } catch (error) {
        if (!cancelled) {
          setEmbedInfo(null);
          setEmbedError(error instanceof Error ? error.message : "Unable to fetch embed token.");
        }
      }
    }

    void loadEmbed();

    return () => {
      cancelled = true;
    };
  }, [adapter.powerBI, selectedReport]);

  useEffect(() => {
    if (!branding.logoUrl) {
      setLogoAspectRatio(1);
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) {
        return;
      }
      const ratio = image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : 1;
      setLogoAspectRatio(Number.isFinite(ratio) && ratio > 0 ? ratio : 1);
    };
    image.onerror = () => {
      if (!cancelled) {
        setLogoAspectRatio(1);
      }
    };
    image.src = branding.logoUrl;

    return () => {
      cancelled = true;
    };
  }, [branding.logoUrl]);

  if (loading || !content) {
    return (
      <section style={{ ...rootStyle(theme), padding: 32 }}>
        <p style={{ margin: 0, color: theme.mutedText }}>Loading portal experience...</p>
      </section>
    );
  }

  const activeReportEmbedUrl = embedInfo?.embedUrl ?? selectedReport?.embedUrl ?? "";

  return (
    <section style={rootStyle(theme)}>
      <div style={shellStyle()}>
        <aside style={sidebarStyle(theme)}>
          <div style={{ display: "grid", gap: 14 }}>
            {branding.logoUrl ? (
              <div
                style={{
                  width: logoLayout.frameWidth,
                  height: logoLayout.frameHeight,
                  borderRadius: logoLayout.borderRadius,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(255, 255, 255, 0.9)",
                  border: `1px solid ${shadeHexColor(theme.primary, -16)}`,
                  boxShadow: "0 10px 18px rgba(7, 28, 44, 0.22)",
                }}
              >
                <img
                  src={branding.logoUrl}
                  alt={`${branding.companyName} logo`}
                  style={{
                    width: logoLayout.imageWidth,
                    height: logoLayout.imageHeight,
                    objectFit: "contain",
                  }}
                />
              </div>
            ) : null}
            <div style={profileCardStyle(theme)}>
              <span style={avatarStyle(theme)}>{initialsFromName(session?.name)}</span>
              <div style={{ display: "grid", gap: 2 }}>
                <strong style={{ color: "#f2f8fb", fontSize: 20 }}>{session?.name ?? "Portal User"}</strong>
                <span style={{ color: "rgba(222, 242, 248, 0.86)" }}>{session?.role ?? "Analyst"}</span>
              </div>
            </div>
            <nav style={{ display: "grid", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setView("overview");
                  pushView(basePath, "overview");
                }}
                style={sidebarNavButtonStyle(theme, view === "overview")}
              >
                Home
              </button>
              {resolvedFeatures.reports ? (
                <button
                  type="button"
                  onClick={() => {
                    setView("reports");
                    pushView(basePath, "reports");
                  }}
                  style={sidebarNavButtonStyle(theme, view === "reports")}
                >
                  Reports
                </button>
              ) : null}
            </nav>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <strong style={{ color: "#ebf6fa", fontSize: 30, letterSpacing: "0.01em", lineHeight: 1.1 }}>{branding.companyName}</strong>
            <button type="button" style={sidebarSignOutButtonStyle(theme)}>
              <i className="pi pi-sign-out" aria-hidden="true" style={{ fontSize: 12 }} />
              <span>Sign Out</span>
            </button>
            {branding.tagLine ? <p style={{ margin: 0, color: "rgba(222, 242, 248, 0.9)" }}>{branding.tagLine}</p> : null}
          </div>
        </aside>

        <main style={mainColumnStyle()}>
          <header style={mainHeaderStyle(theme)}>
            <div>
              <p style={headingEyebrowStyle(theme)}>{view === "overview" ? "Customer Overview" : "IT Reports"}</p>
              <h1 style={{ margin: "8px 0 0", fontSize: "clamp(1.3rem, 2vw, 1.7rem)", color: theme.text }}>{content.headline}</h1>
              <p style={{ margin: "8px 0 0", color: theme.mutedText }}>{content.subheadline}</p>
            </div>
            <p style={{ margin: 0, color: theme.mutedText }}>{content.statusMessage}</p>
          </header>

          {view === "overview" ? (
            <OverviewPanel content={content} theme={theme} />
          ) : null}

          {view === "reports" && resolvedFeatures.reports ? (
            <ReportsPanel
              reports={reports}
              multiViews={multiViews}
              selectedReport={selectedReport}
              selectedMultiView={selectedMultiView}
              embedInfo={embedInfo}
              embedError={embedError}
              theme={theme}
              activeReportEmbedUrl={activeReportEmbedUrl}
              onSelectReport={(report) => {
                setSelectedReport(report);
                setSelectedMultiView(null);
              }}
              onSelectMultiView={(multiView) => {
                setSelectedMultiView(multiView);
                setSelectedReport(null);
                setEmbedInfo(null);
                setEmbedError("");
              }}
            />
          ) : null}
        </main>

        <aside style={rightRailStyle(theme)}>
          <div style={settingsOrbStyle(theme)} />
          <article style={panelCardStyle(theme)}>
            <h2 style={{ margin: 0, fontSize: 26, letterSpacing: "0.03em", textTransform: "uppercase", color: theme.text }}>Recent Dashboards</h2>
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setView("overview");
                  pushView(basePath, "overview");
                }}
                style={dashboardShortcutStyle(theme, view === "overview")}
              >
                Home
              </button>
              {resolvedFeatures.reports ? (
                <button
                  type="button"
                  onClick={() => {
                    setView("reports");
                    pushView(basePath, "reports");
                  }}
                  style={dashboardShortcutStyle(theme, view === "reports")}
                >
                  Report Center
                </button>
              ) : null}
            </div>
          </article>
          <article style={panelCardStyle(theme)}>
            <p style={headingEyebrowStyle(theme)}>Session</p>
            <strong style={{ display: "block", marginTop: 8, color: theme.text }}>{session?.email ?? "No session email available"}</strong>
            {embedError ? <p style={{ margin: "10px 0 0", color: "#9b2f2f" }}>{embedError}</p> : null}
          </article>
        </aside>
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
  const midpoint = Math.max(1, Math.ceil(content.widgets.length / 2));
  const leftWidgets = content.widgets.slice(0, midpoint);
  const rightWidgets = content.widgets.slice(midpoint);

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)", alignItems: "start" }}>
      <article style={panelCardStyle(theme)}>
        <p style={headingEyebrowStyle(theme)}>System Modules</p>
        <div style={{ marginTop: 12, display: "grid", gap: 14, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <div style={{ display: "grid", gap: 10 }}>
            {leftWidgets.map((widget) => (
              <div key={widget.id} style={widgetRowStyle(theme)}>
                <strong style={{ color: toneColor(widget.tone), fontSize: 21 }}>{widget.title}</strong>
                <span style={{ color: theme.text, fontWeight: 700 }}>{widget.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {rightWidgets.length
              ? rightWidgets.map((widget) => (
                  <div key={widget.id} style={widgetRowStyle(theme)}>
                    <strong style={{ color: toneColor(widget.tone), fontSize: 21 }}>{widget.title}</strong>
                    <span style={{ color: theme.text, fontWeight: 700 }}>{widget.value}</span>
                  </div>
                ))
              : null}
          </div>
        </div>
        {content.announcements?.length ? (
          <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
            {content.announcements.map((item) => (
              <div key={item} style={listItemStyle(theme)}>
                {item}
              </div>
            ))}
          </div>
        ) : null}
      </article>

      <div style={{ display: "grid", gap: 14 }}>
        <article style={panelCardStyle(theme)}>
          <p style={headingEyebrowStyle(theme)}>Report Objective</p>
          <p style={{ margin: "10px 0 0", color: theme.text }}>
            {content.reportGoal ?? "Define report objectives to guide the first Power BI implementation phase."}
          </p>
        </article>
        <article style={panelCardStyle(theme)}>
          <p style={headingEyebrowStyle(theme)}>Status</p>
          <p style={{ margin: "10px 0 0", color: theme.text }}>{content.statusMessage}</p>
        </article>
      </div>
    </div>
  );
}

function ReportsPanel({
  reports,
  multiViews,
  selectedReport,
  selectedMultiView,
  embedInfo,
  embedError,
  theme,
  activeReportEmbedUrl,
  onSelectReport,
  onSelectMultiView,
}: {
  reports: PowerBIReportRef[];
  multiViews: MultiViewConfig[];
  selectedReport: PowerBIReportRef | null;
  selectedMultiView: MultiViewConfig | null;
  embedInfo: PowerBIEmbedInfo | null;
  embedError: string;
  theme: ReturnType<typeof getTheme>;
  activeReportEmbedUrl: string;
  onSelectReport: (report: PowerBIReportRef) => void;
  onSelectMultiView: (multiView: MultiViewConfig) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(260px, 0.9fr) minmax(0, 1.1fr)" }}>
      <article style={panelCardStyle(theme)}>
        <p style={headingEyebrowStyle(theme)}>Available Reports</p>
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {reports.length ? (
            reports.map((report) => (
              <button
                key={report.reportId}
                type="button"
                onClick={() => onSelectReport(report)}
                style={selectButtonStyle(theme, selectedReport?.reportId === report.reportId)}
              >
                <strong>{report.name}</strong>
                <span>{report.workspaceName ?? "Workspace not set"}</span>
              </button>
            ))
          ) : (
            <p style={{ margin: 0, color: theme.mutedText }}>No reports loaded yet.</p>
          )}
        </div>

        <p style={{ ...headingEyebrowStyle(theme), marginTop: 20 }}>Multi-view Layouts</p>
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {multiViews.length ? (
            multiViews.map((multiView) => (
              <button
                key={multiView.id}
                type="button"
                onClick={() => onSelectMultiView(multiView)}
                style={selectButtonStyle(theme, selectedMultiView?.id === multiView.id)}
              >
                <strong>{multiView.name}</strong>
                <span>{multiView.tiles.length} tiles</span>
              </button>
            ))
          ) : (
            <p style={{ margin: 0, color: theme.mutedText }}>No multi-view layouts available.</p>
          )}
        </div>
      </article>

      <article style={panelCardStyle(theme)}>
        {selectedReport ? (
          <>
            <p style={headingEyebrowStyle(theme)}>Report Preview</p>
            <h2 style={{ margin: "8px 0 0" }}>{selectedReport.name}</h2>
            <p style={{ margin: "10px 0 0", color: theme.mutedText }}>
              {selectedReport.description ?? "No description provided."}
            </p>
            {activeReportEmbedUrl ? (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 16,
                  overflow: "hidden",
                  border: `1px solid ${theme.accent}`,
                  background: "#ffffff",
                  minHeight: 500,
                }}
              >
                <iframe
                  title={selectedReport.name}
                  src={activeReportEmbedUrl}
                  style={{ width: "100%", minHeight: 500, border: "none", background: "#ffffff" }}
                />
              </div>
            ) : null}
            <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
              <span style={{ color: theme.mutedText }}>Report ID: {selectedReport.reportId}</span>
              <span style={{ color: theme.mutedText }}>Group ID: {selectedReport.groupId ?? "N/A"}</span>
              {embedInfo ? (
                <>
                  <span style={{ color: theme.mutedText }}>Token expires: {new Date(embedInfo.tokenExpiry).toLocaleString()}</span>
                  <a href={embedInfo.embedUrl} style={{ color: theme.primary, fontWeight: 700 }} target="_blank" rel="noreferrer">
                    Open Power BI embed URL
                  </a>
                </>
              ) : null}
              {embedError ? <p style={{ margin: 0, color: "#922d2d" }}>{embedError}</p> : null}
            </div>
          </>
        ) : null}

        {selectedMultiView ? (
          <>
            <p style={headingEyebrowStyle(theme)}>Multi-view Layout</p>
            <h2 style={{ margin: "8px 0 0" }}>{selectedMultiView.name}</h2>
            <p style={{ margin: "10px 0 0", color: theme.mutedText }}>
              {selectedMultiView.description ?? "Saved report composition for side-by-side executive review."}
            </p>
            <div
              style={{
                marginTop: 14,
                display: "grid",
                gap: 10,
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              }}
            >
              {selectedMultiView.tiles.map((tile) => (
                <div key={tile.id} style={widgetRowStyle(theme)}>
                  <strong>{tile.title}</strong>
                  <span style={{ color: theme.mutedText, fontSize: 12 }}>
                    {tile.w}x{tile.h} at ({tile.x},{tile.y})
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {!selectedReport && !selectedMultiView ? (
          <p style={{ margin: 0, color: theme.mutedText }}>Select a report or multi-view from the left panel.</p>
        ) : null}
      </article>
    </div>
  );
}

function rootStyle(theme: ReturnType<typeof getTheme>) {
  return {
    color: theme.text,
    background: theme.surface,
    minHeight: "100%",
    height: "100%",
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    borderRadius: 22,
    border: `1px solid ${theme.accent}`,
    boxShadow: "0 16px 36px rgba(18, 42, 58, 0.12)",
    overflow: "hidden",
  } satisfies React.CSSProperties;
}

function shellStyle() {
  return {
    display: "grid",
    gridTemplateColumns: "240px minmax(0, 1fr) 300px",
    minHeight: "100%",
    height: "100%",
  } satisfies React.CSSProperties;
}

function sidebarStyle(theme: ReturnType<typeof getTheme>) {
  return {
    padding: "20px 16px",
    background: `linear-gradient(180deg, ${theme.primary} 0%, ${shadeHexColor(theme.primary, -24)} 100%)`,
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    gap: 18,
    color: "#e7f4f8",
    borderRight: `1px solid ${shadeHexColor(theme.primary, -30)}`,
  } satisfies React.CSSProperties;
}

function mainColumnStyle() {
  return {
    padding: 16,
    display: "grid",
    gridTemplateRows: "auto 1fr",
    gap: 16,
    minWidth: 0,
    overflow: "auto",
  } satisfies React.CSSProperties;
}

function mainHeaderStyle(theme: ReturnType<typeof getTheme>) {
  return {
    borderRadius: 16,
    padding: 18,
    background: "rgba(255, 255, 255, 0.85)",
    border: `1px solid ${theme.accent}`,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  } satisfies React.CSSProperties;
}

function rightRailStyle(theme: ReturnType<typeof getTheme>) {
  return {
    borderLeft: `1px solid ${theme.accent}`,
    background: "rgba(255, 255, 255, 0.45)",
    padding: 16,
    display: "grid",
    alignContent: "start",
    gap: 14,
    overflow: "auto",
  } satisfies React.CSSProperties;
}

function profileCardStyle(theme: ReturnType<typeof getTheme>) {
  return {
    display: "grid",
    gridTemplateColumns: "54px 1fr",
    gap: 10,
    alignItems: "center",
    padding: 10,
    borderRadius: 14,
    border: `1px solid ${shadeHexColor(theme.primary, -16)}`,
    background: "rgba(255, 255, 255, 0.08)",
  } satisfies React.CSSProperties;
}

function avatarStyle(theme: ReturnType<typeof getTheme>) {
  return {
    width: 52,
    height: 52,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    fontWeight: 800,
    color: shadeHexColor(theme.primary, -35),
    background: "rgba(224, 246, 240, 0.9)",
  } satisfies React.CSSProperties;
}

function sidebarNavButtonStyle(theme: ReturnType<typeof getTheme>, active: boolean) {
  return {
    border: `1px solid ${active ? "rgba(196, 230, 241, 0.45)" : "transparent"}`,
    borderRadius: 12,
    background: active ? "rgba(207, 235, 245, 0.24)" : "transparent",
    color: "#edf8fc",
    textAlign: "left" as const,
    fontWeight: 700,
    padding: "12px 14px",
    cursor: "pointer",
    boxShadow: active ? "inset 0 1px 0 rgba(255, 255, 255, 0.1)" : "none",
  } satisfies React.CSSProperties;
}

function sidebarSignOutButtonStyle(theme: ReturnType<typeof getTheme>) {
  return {
    border: `1px solid ${shadeHexColor(theme.primary, -14)}`,
    borderRadius: 10,
    width: "fit-content",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(255, 255, 255, 0.1)",
    color: "#edf8fc",
    textAlign: "left" as const,
    fontWeight: 700,
    fontSize: 13,
    padding: "7px 10px",
    cursor: "default",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 4px 10px rgba(2, 20, 34, 0.14)",
  } satisfies React.CSSProperties;
}

function settingsOrbStyle(theme: ReturnType<typeof getTheme>) {
  return {
    width: 52,
    height: 52,
    borderRadius: 999,
    justifySelf: "end",
    background: "#f2f7fa",
    border: `1px solid ${theme.accent}`,
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.8)",
  } satisfies React.CSSProperties;
}

function panelCardStyle(theme: ReturnType<typeof getTheme>) {
  return {
    padding: 16,
    borderRadius: 14,
    border: `1px solid ${theme.accent}`,
    background: "rgba(255, 255, 255, 0.9)",
  } satisfies React.CSSProperties;
}

function dashboardShortcutStyle(theme: ReturnType<typeof getTheme>, active: boolean) {
  return {
    border: `1px solid ${active ? theme.primary : theme.accent}`,
    borderRadius: 12,
    background: active ? "rgba(13, 103, 126, 0.1)" : "#f8fbfc",
    color: theme.text,
    fontWeight: 700,
    textAlign: "left" as const,
    padding: "10px 12px",
    cursor: "pointer",
  } satisfies React.CSSProperties;
}

function headingEyebrowStyle(theme: ReturnType<typeof getTheme>) {
  return {
    margin: 0,
    color: theme.mutedText,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontWeight: 700,
  } satisfies React.CSSProperties;
}

function widgetRowStyle(theme: ReturnType<typeof getTheme>) {
  return {
    padding: "12px 14px",
    borderRadius: 12,
    background: "#edf3f6",
    border: `1px solid ${theme.accent}`,
    display: "grid",
    gap: 4,
  } satisfies React.CSSProperties;
}

function listItemStyle(theme: ReturnType<typeof getTheme>) {
  return {
    padding: "10px 12px",
    borderRadius: 12,
    background: "#edf3f6",
    border: `1px solid ${theme.accent}`,
  } satisfies React.CSSProperties;
}

function selectButtonStyle(theme: ReturnType<typeof getTheme>, selected: boolean) {
  return {
    border: `1px solid ${selected ? theme.primary : theme.accent}`,
    borderRadius: 14,
    background: selected ? "rgba(69, 80, 95, 0.1)" : "#ffffff",
    padding: "12px 14px",
    textAlign: "left" as const,
    display: "grid",
    gap: 5,
    cursor: "pointer",
    color: theme.text,
  };
}

function toneColor(tone?: "positive" | "neutral" | "warning") {
  if (tone === "positive") {
    return "#1b8c62";
  }
  if (tone === "warning") {
    return "#b16815";
  }
  return "#4b6377";
}

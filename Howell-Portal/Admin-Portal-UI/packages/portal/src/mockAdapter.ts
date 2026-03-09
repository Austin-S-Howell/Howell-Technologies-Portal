import type {
  MultiViewConfig,
  PortalAdapter,
  PortalContent,
  PortalSession,
  PowerBIEmbedInfo,
  PowerBIReportRef,
} from "./types";

interface MockAdapterOptions {
  session?: PortalSession;
  content?: Partial<PortalContent>;
  reports?: PowerBIReportRef[];
  multiViews?: MultiViewConfig[];
  embedInfo?: Partial<PowerBIEmbedInfo>;
}

const defaultSession: PortalSession = {
  id: "mock-user",
  name: "Portal User",
  email: "portal.user@example.com",
  role: "Operations Lead",
};

const defaultReports: PowerBIReportRef[] = [
  {
    reportId: "pbi-monthly-kpis",
    groupId: "workspace-ops",
    name: "Monthly KPI Snapshot",
    description: "Executive KPI report for operations leadership.",
    embedUrl: "https://app.powerbi.com/reportEmbed?reportId=pbi-monthly-kpis",
    workspaceName: "Operations Workspace",
    lastUpdated: "2 hours ago",
  },
  {
    reportId: "pbi-client-health",
    groupId: "workspace-ops",
    name: "Client Health Matrix",
    description: "Live/degraded/down posture by client and environment.",
    embedUrl: "https://app.powerbi.com/reportEmbed?reportId=pbi-client-health",
    workspaceName: "Operations Workspace",
    lastUpdated: "5 minutes ago",
  },
];

const defaultMultiViews: MultiViewConfig[] = [
  {
    id: "mv-exec",
    name: "Executive morning brief",
    description: "Split-view for KPI and health posture.",
    tiles: [
      { id: "tile-1", reportId: "pbi-monthly-kpis", groupId: "workspace-ops", title: "KPI Overview", x: 0, y: 0, w: 6, h: 4 },
      { id: "tile-2", reportId: "pbi-client-health", groupId: "workspace-ops", title: "Client Health", x: 6, y: 0, w: 6, h: 4 },
    ],
  },
];

const defaultContent: PortalContent = {
  headline: "Your portal command center",
  subheadline: "Homepage widgets and Power BI report workflows delivered from one reusable package.",
  statusMessage: "All configured services are healthy.",
  reportGoal: "Surface top operations KPIs and client downtime risks in one executive workflow.",
  widgets: [
    { id: "availability", title: "Availability", type: "metric", value: "99.96%", tone: "positive" },
    { id: "active-users", title: "Active users", type: "metric", value: "142", tone: "neutral" },
    { id: "attention", title: "Needs attention", type: "status", value: "3 services", tone: "warning" },
  ],
  announcements: ["Nightly sync completed successfully.", "A new onboarding document is ready for review."],
};

export function createMockPortalAdapter(options: MockAdapterOptions = {}): PortalAdapter {
  const reports = options.reports ?? defaultReports;
  const multiViews = options.multiViews ?? defaultMultiViews;
  const embedInfo: PowerBIEmbedInfo = {
    reportId: reports[0]?.reportId ?? "pbi-monthly-kpis",
    groupId: reports[0]?.groupId,
    embedUrl: reports[0]?.embedUrl ?? "https://app.powerbi.com/reportEmbed",
    embedToken: "mock-embed-token",
    tokenExpiry: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    ...options.embedInfo,
  };

  return {
    auth: {
      getSession: async () => options.session ?? defaultSession,
    },
    portalData: {
      getContent: async () => ({
        ...defaultContent,
        ...options.content,
      }),
    },
    reports: {
      getReports: async () => reports,
      getMultiViews: async () => multiViews,
    },
    powerBI: {
      getEmbedInfo: async (params) => ({
        ...embedInfo,
        reportId: params.reportId,
        groupId: params.groupId,
      }),
    },
  };
}

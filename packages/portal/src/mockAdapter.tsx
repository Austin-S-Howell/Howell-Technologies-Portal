import type {
  PortalAdapter,
  PortalContent,
  PortalDocumentItem,
  PortalReportItem,
  PortalSession,
  PortalTicketSummary,
} from "./types";

interface MockAdapterOptions {
  session?: PortalSession;
  content?: Partial<PortalContent>;
  reports?: PortalReportItem[];
  ticketSummary?: PortalTicketSummary | null;
  documents?: PortalDocumentItem[];
}

const defaultSession: PortalSession = {
  id: "mock-user",
  name: "Portal User",
  email: "portal.user@example.com",
  role: "Operations Lead",
};

const defaultContent: PortalContent = {
  headline: "Your portal command center",
  subheadline: "Shared portal shell, reports, and support data delivered from one reusable package.",
  statusMessage: "All configured services are healthy.",
  metrics: [
    { id: "availability", label: "Availability", value: "99.96%", trend: "+0.3% this month", tone: "positive" },
    { id: "active-users", label: "Active users", value: "142", trend: "12 new this week", tone: "neutral" },
    { id: "automation", label: "Automations", value: "18", trend: "2 failed runs", tone: "warning" },
  ],
  reports: [
    { id: "monthly-kpis", name: "Monthly KPIs", description: "Executive KPI deck for your portal.", lastUpdated: "2 hours ago" },
  ],
  ticketSummary: {
    provider: "Tech Connect",
    openCount: 6,
    urgentCount: 1,
    lastUpdated: "15 minutes ago",
    href: "#tickets",
  },
  documents: [
    { id: "runbook", title: "Portal Runbook", summary: "Core response steps for operational issues.", href: "#runbook" },
  ],
  announcements: [
    "Nightly sync completed successfully.",
    "A new onboarding document is ready for review.",
  ],
};

export function createMockPortalAdapter(options: MockAdapterOptions = {}): PortalAdapter {
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
      getReports: async () => options.reports ?? defaultContent.reports ?? [],
    },
    tickets: {
      getTicketSummary: async () => options.ticketSummary ?? defaultContent.ticketSummary ?? null,
    },
    documents: {
      getDocuments: async () => options.documents ?? defaultContent.documents ?? [],
    },
  };
}

import { PortalApp, buildPortalFromConfig } from "@howell-technologies/portal";

const portalBuild = buildPortalFromConfig({
  companyName: "Riverbend Health",
  audience: "Operations and executive stakeholders",
  branding: {
    companyName: "Riverbend Health",
    tagLine: "Client-facing portal experience powered by Howell Technologies.",
    theme: {
      primary: "#304352",
      surface: "#f3f6fa",
      accent: "#d4dae3",
      text: "#1f2934",
      mutedText: "#5a6470",
    },
  },
  features: { reports: true },
  session: {
    id: "client-demo-user",
    name: "Morgan Lee",
    email: "morgan@riverbendhealth.example.com",
    role: "Operations Director",
  },
  content: {
    headline: "Riverbend Care Hub",
    subheadline: "A branded portal shell focused on homepage widgets and Power BI report workflows.",
    statusMessage: "Core care operations are stable.",
    reportGoal: "Enable leadership to track patient access and operational KPIs every morning.",
    announcements: ["Monthly KPI review is now available in Reports.", "Support runbook updates were published this morning."],
    widgets: [
      { id: "widget-availability", title: "Availability", type: "metric", value: "99.98%", tone: "positive" },
      { id: "widget-incidents", title: "Open incidents", type: "status", value: "2", tone: "warning" },
      { id: "widget-users", title: "Daily active users", type: "metric", value: "1,247", tone: "neutral" },
    ],
  },
  reports: [
    {
      reportId: "riverbend-ops-overview",
      groupId: "riverbend-workspace",
      name: "Operations Overview",
      description: "Cross-team KPI and availability summary.",
      embedUrl: "https://app.powerbi.com/reportEmbed?reportId=riverbend-ops-overview",
      workspaceName: "Riverbend Analytics",
      lastUpdated: "5 minutes ago",
    },
    {
      reportId: "riverbend-patient-access",
      groupId: "riverbend-workspace",
      name: "Patient Access Performance",
      description: "Referral cycle time and appointment throughput.",
      embedUrl: "https://app.powerbi.com/reportEmbed?reportId=riverbend-patient-access",
      workspaceName: "Riverbend Analytics",
      lastUpdated: "22 minutes ago",
    },
  ],
  multiViews: [
    {
      id: "riverbend-mv-exec",
      name: "Executive daily view",
      description: "Two-report layout for the daily brief.",
      tiles: [
        {
          id: "tile-ops",
          reportId: "riverbend-ops-overview",
          groupId: "riverbend-workspace",
          title: "Operations overview",
          x: 0,
          y: 0,
          w: 6,
          h: 4,
        },
        {
          id: "tile-access",
          reportId: "riverbend-patient-access",
          groupId: "riverbend-workspace",
          title: "Patient access",
          x: 6,
          y: 0,
          w: 6,
          h: 4,
        },
      ],
    },
  ],
});

export default function App() {
  return (
    <main style={{ padding: 32, minHeight: "100vh", background: "#edf5fa" }}>
      <PortalApp {...portalBuild} basePath="/portal" />
    </main>
  );
}

import type { CompanyPOCConfig } from "@howell-technologies/portal";
import type { POCGeneratorState } from "./types";

export function createDefaultPOCConfig(): CompanyPOCConfig {
  return {
    companyName: "Howell Technologies Demo Company",
    audience: "Operations leaders and support managers",
    branding: {
      companyName: "Howell Technologies Demo Company",
      tagLine: "Streamline your operations",
      theme: {
        primary: "#0d677e",
        surface: "#d5dde2",
        accent: "#c5ced5",
        text: "#193543",
        mutedText: "#4e6c7b",
      },
    },
    features: {
      reports: true,
    },
    session: {
      id: "poc-user-1",
      name: "Sarah Howell",
      email: "demo@howelltechnologies.com",
      role: "Analyst",
    },
    content: {
      headline: "Customer Operations Workspace",
      subheadline: "Live operations view with report browsing and multi-view workspace layouts.",
      statusMessage: "Live - Just now",
      reportGoal: "Show a polished stock market intelligence view with executive-ready dashboard composition.",
      announcements: ["Generated from Howell POC Generator.", "Use Reports to demo the Power BI-style stock dashboard experience."],
      widgets: [
        { id: "widget-overview-1", title: "S&P Trend", type: "status", value: "Bullish", tone: "positive" },
        { id: "widget-overview-2", title: "NASDAQ Momentum", type: "status", value: "Live · Up 1.11%", tone: "positive" },
        { id: "widget-overview-3", title: "Portfolio Volatility", type: "status", value: "Moderate", tone: "neutral" },
        { id: "widget-overview-4", title: "Critical Alerts", type: "status", value: "0", tone: "warning" },
      ],
    },
    reports: [
      {
        reportId: "stock-market-live",
        groupId: "workspace-demo",
        name: "Stock Market Pulse",
        description: "Power BI-style market overview with trend, volume, and watchlist metrics.",
        embedUrl: "demo://stock-market-pulse",
        workspaceName: "Financial Intelligence",
        lastUpdated: "5 minutes ago",
      },
      {
        reportId: "stock-sector-rotation",
        groupId: "workspace-demo",
        name: "Sector Rotation Monitor",
        description: "Cross-sector flow and allocation posture for strategy reviews.",
        embedUrl: "demo://stock-sector-rotation",
        workspaceName: "Financial Intelligence",
        lastUpdated: "2 minutes ago",
      },
    ],
    multiViews: [
      {
        id: "mv-exec-brief",
        name: "Executive Morning Brief",
        description: "Split-view for KPI trend and client health.",
        tiles: [
          {
            id: "tile-1",
            reportId: "stock-market-live",
            groupId: "workspace-demo",
            title: "Market Pulse",
            x: 0,
            y: 0,
            w: 6,
            h: 4,
          },
          {
            id: "tile-2",
            reportId: "stock-sector-rotation",
            groupId: "workspace-demo",
            title: "Sector Rotation",
            x: 6,
            y: 0,
            w: 6,
            h: 4,
          },
        ],
      },
    ],
  };
}

export function createDefaultPOCState(): POCGeneratorState {
  return {
    configName: "Howell Demo POC",
    config: createDefaultPOCConfig(),
  };
}

export function clonePOCState(state: POCGeneratorState): POCGeneratorState {
  return JSON.parse(JSON.stringify(state)) as POCGeneratorState;
}

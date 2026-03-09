import type { ReactNode } from "react";

export type PortalView = "overview" | "reports" | "tickets" | "documents";

export interface PortalBranding {
  companyName: string;
  logoUrl?: string;
  tagLine?: string;
  theme?: {
    primary?: string;
    surface?: string;
    accent?: string;
    text?: string;
    mutedText?: string;
  };
}

export interface PortalFeatures {
  reports?: boolean;
  tickets?: boolean;
  documents?: boolean;
}

export interface PortalSession {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface PortalNavigationItem {
  id: PortalView;
  label: string;
  description?: string;
}

export interface PortalMetric {
  id: string;
  label: string;
  value: string;
  trend?: string;
  tone?: "positive" | "neutral" | "warning";
}

export interface PortalReportItem {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
}

export interface PortalTicketSummary {
  provider: string;
  openCount: number;
  urgentCount: number;
  lastUpdated: string;
  href?: string;
}

export interface PortalDocumentItem {
  id: string;
  title: string;
  summary: string;
  href?: string;
}

export interface PortalContent {
  headline: string;
  subheadline: string;
  statusMessage: string;
  metrics: PortalMetric[];
  reports?: PortalReportItem[];
  ticketSummary?: PortalTicketSummary;
  documents?: PortalDocumentItem[];
  announcements?: string[];
  supportPanel?: ReactNode;
}

export interface PortalAuthAdapter {
  getSession: () => Promise<PortalSession | null>;
  signOut?: () => Promise<void>;
}

export interface PortalDataAdapter {
  getContent: () => Promise<PortalContent>;
}

export interface PortalReportsAdapter {
  getReports: () => Promise<PortalReportItem[]>;
}

export interface PortalTicketsAdapter {
  getTicketSummary: () => Promise<PortalTicketSummary | null>;
}

export interface PortalDocumentsAdapter {
  getDocuments: () => Promise<PortalDocumentItem[]>;
}

export interface PortalAdapter {
  auth: PortalAuthAdapter;
  portalData: PortalDataAdapter;
  reports?: PortalReportsAdapter;
  tickets?: PortalTicketsAdapter;
  documents?: PortalDocumentsAdapter;
}

export interface PortalAppProps {
  branding: PortalBranding;
  features?: PortalFeatures;
  adapter: PortalAdapter;
  session?: PortalSession | null;
  basePath?: string;
}

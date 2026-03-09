export type PortalView = "overview" | "reports";

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
}

export interface PortalSession {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface HomepageWidgetConfig {
  id: string;
  title: string;
  type: "metric" | "status" | "text";
  value: string;
  description?: string;
  tone?: "positive" | "neutral" | "warning";
}

export interface PowerBIReportRef {
  reportId: string;
  groupId?: string;
  name: string;
  description?: string;
  embedUrl: string;
  workspaceName?: string;
  lastUpdated?: string;
}

export interface MultiViewTile {
  id: string;
  reportId: string;
  groupId?: string;
  title: string;
  pageName?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MultiViewConfig {
  id: string;
  name: string;
  description?: string;
  tiles: MultiViewTile[];
}

export interface PortalContent {
  headline: string;
  subheadline: string;
  statusMessage: string;
  announcements?: string[];
  reportGoal?: string;
  widgets: HomepageWidgetConfig[];
}

export interface PowerBIEmbedInfo {
  reportId: string;
  groupId?: string;
  embedUrl: string;
  embedToken: string;
  tokenExpiry: string;
  pageName?: string;
}

export interface PortalAuthAdapter {
  getSession: () => Promise<PortalSession | null>;
  signOut?: () => Promise<void>;
}

export interface PortalDataAdapter {
  getContent: () => Promise<PortalContent>;
}

export interface PortalReportsAdapter {
  getReports: () => Promise<PowerBIReportRef[]>;
  getMultiViews?: () => Promise<MultiViewConfig[]>;
}

export interface PortalPowerBIAdapter {
  getEmbedInfo: (params: { reportId: string; groupId?: string; pageName?: string }) => Promise<PowerBIEmbedInfo>;
}

export interface PortalAdapter {
  auth: PortalAuthAdapter;
  portalData: PortalDataAdapter;
  reports?: PortalReportsAdapter;
  powerBI?: PortalPowerBIAdapter;
}

export interface PortalAppProps {
  branding: PortalBranding;
  features?: PortalFeatures;
  adapter: PortalAdapter;
  session?: PortalSession | null;
  basePath?: string;
}

export interface CompanyPOCConfig {
  companyName: string;
  audience: string;
  branding: PortalBranding;
  features: Required<PortalFeatures>;
  session: PortalSession;
  content: PortalContent;
  reports: PowerBIReportRef[];
  multiViews: MultiViewConfig[];
}

export interface PortalBuildResult {
  branding: PortalBranding;
  features: PortalFeatures;
  session: PortalSession;
  adapter: PortalAdapter;
}

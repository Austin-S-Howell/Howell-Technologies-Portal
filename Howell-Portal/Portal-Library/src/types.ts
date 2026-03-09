import type { ReactNode } from "react";

export type PortalStatusState = "live" | "degraded" | "down";

export interface PortalThemeTokens {
  primary?: string;
  surface?: string;
  accent?: string;
  text?: string;
  mutedText?: string;
}

export interface PortalBranding {
  companyName: string;
  logoUrl?: string;
  tagLine?: string;
  theme?: PortalThemeTokens;
}

export interface PortalSession {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface PortalNavigationItem {
  id: string;
  label: string;
  href?: string;
  badge?: string;
  active?: boolean;
  onSelect?: () => void;
}

export interface PortalHeartbeatSnapshot {
  status?: PortalStatusState;
  message?: string;
  responseTimeMs?: number;
  currentPath?: string;
  buildVersion?: string;
}

type Awaitable<T> = T | Promise<T>;

export interface PortalHeartbeatConfig {
  endpoint: string;
  clientId: string;
  applicationId: string;
  portalName: string;
  enabled?: boolean;
  apiKey?: string;
  clientName?: string;
  applicationName?: string;
  portalUrl?: string;
  environment?: string;
  buildVersion?: string;
  intervalMs?: number;
  getSnapshot?: () => Awaitable<PortalHeartbeatSnapshot>;
  onError?: (error: Error) => void;
  fetcher?: typeof fetch;
}

export interface PortalHeartbeatPayload {
  clientId: string;
  clientName?: string;
  applicationId: string;
  applicationName?: string;
  portalName: string;
  portalUrl?: string;
  environment?: string;
  status: PortalStatusState;
  message?: string;
  responseTimeMs?: number;
  currentPath?: string;
  buildVersion?: string;
  checkedAt: string;
}

export interface PortalHeartbeatResult {
  payload: PortalHeartbeatPayload;
}

export interface PortalHeartbeatState {
  lastReportedAt: string | null;
  lastError: string | null;
  lastSnapshot: PortalHeartbeatPayload | null;
}

export interface PortalShellProps {
  branding: PortalBranding;
  session?: PortalSession | null;
  navigation?: PortalNavigationItem[];
  headline: string;
  subheadline?: string;
  statusMessage?: string;
  children: ReactNode;
  rightRail?: ReactNode;
  sidebarFooter?: ReactNode;
  onSignOut?: () => void;
  monitoring?: PortalHeartbeatConfig;
}

export interface PortalPanelProps {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
}

export interface PortalStatusBadgeProps {
  state: PortalStatusState;
  label?: string;
}

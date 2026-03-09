export type ApplicationState = "live" | "degraded" | "down";

export interface OperatorSession {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface OperatorCredentialRecord extends OperatorSession {
  password: string;
}

export interface ClientApplication {
  id: string;
  name: string;
  environment: string;
  status: ApplicationState;
  uptime: string;
  responseTime: string;
  lastChecked: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  industry: string;
  portalName: string;
  portalUrl: string;
  embeddedBasePath: string;
  primaryContact: string;
  notes: string;
  ticketProvider: string;
  buildVersion: string;
  lastUpdated: string;
  applications: ClientApplication[];
}

export interface IncidentRecord {
  id: string;
  clientId: string;
  title: string;
  severity: "critical" | "warning" | "info";
  summary: string;
  timestamp: string;
}

export interface DashboardSnapshot {
  totalClients: number;
  totalApplications: number;
  liveApplications: number;
  degradedApplications: number;
  downApplications: number;
  ticketingProviders: string[];
  clientSummaries: Array<{
    id: string;
    name: string;
    portalName: string;
    live: number;
    degraded: number;
    down: number;
    portalUrl: string;
  }>;
  incidents: IncidentRecord[];
}

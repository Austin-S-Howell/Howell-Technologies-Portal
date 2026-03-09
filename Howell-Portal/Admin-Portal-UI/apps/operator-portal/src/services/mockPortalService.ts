import clientsData from "../data/clients.json";
import incidentsData from "../data/incidents.json";
import type { ClientRecord, DashboardSnapshot, IncidentRecord } from "../types";
import { waitForSimulatedDelay } from "./simulatedDelay";

type RuntimeStatusRecord = {
  recordId: string;
  clientId: string;
  clientName?: string | null;
  applicationId: string;
  applicationName?: string | null;
  portalName: string;
  portalUrl?: string | null;
  environment?: string | null;
  reportedStatus: "live" | "degraded" | "down";
  effectiveStatus: "live" | "degraded" | "down";
  message?: string | null;
  responseTimeMs?: number | null;
  currentPath?: string | null;
  buildVersion?: string | null;
  lastPingAt: string;
  isStale: boolean;
};

const isStaticFrontendOnly = (import.meta.env.VITE_STATIC_FE_ONLY as string | undefined) === "true";
const runtimeStatusBaseUrl =
  (import.meta.env.VITE_POC_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "http://localhost:8000";

const clients = clientsData as ClientRecord[];
const incidents = incidentsData as IncidentRecord[];

async function fetchRuntimeStatusRecords(): Promise<RuntimeStatusRecord[]> {
  if (isStaticFrontendOnly || typeof fetch === "undefined") {
    return [];
  }

  try {
    const response = await fetch(`${runtimeStatusBaseUrl}/api/runtime-status/applications`, {
      method: "GET",
    });

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as RuntimeStatusRecord[];
  } catch {
    return [];
  }
}

function formatRuntimeResponseTime(row: RuntimeStatusRecord) {
  if (row.isStale) {
    return "No recent ping";
  }
  if (typeof row.responseTimeMs === "number") {
    return `${row.responseTimeMs}ms`;
  }
  return "Unknown";
}

function mergeClientsWithRuntime(runtimeRows: RuntimeStatusRecord[]): ClientRecord[] {
  const runtimeByClient = new Map<string, RuntimeStatusRecord[]>();
  for (const row of runtimeRows) {
    const items = runtimeByClient.get(row.clientId) ?? [];
    items.push(row);
    runtimeByClient.set(row.clientId, items);
  }

  const mergedClients = clients.map((client) => {
    const clientRuntimeRows = runtimeByClient.get(client.id) ?? [];
    const runtimeByApplication = new Map(clientRuntimeRows.map((row) => [row.applicationId, row]));
    const updatedApplications = client.applications.map((application) => {
      const runtime = runtimeByApplication.get(application.id);
      if (!runtime) {
        return application;
      }

      return {
        ...application,
        name: runtime.applicationName ?? application.name,
        environment: runtime.environment ?? application.environment,
        status: runtime.effectiveStatus,
        responseTime: formatRuntimeResponseTime(runtime),
        lastChecked: runtime.lastPingAt,
      };
    });

    const appendedApplications = clientRuntimeRows
      .filter((row) => !client.applications.some((application) => application.id === row.applicationId))
      .map((row) => ({
        id: row.applicationId,
        name: row.applicationName ?? row.portalName,
        environment: row.environment ?? "Production",
        status: row.effectiveStatus,
        uptime: row.isStale ? "No recent ping" : "Heartbeat active",
        responseTime: formatRuntimeResponseTime(row),
        lastChecked: row.lastPingAt,
      }));

    const latestRuntimeRow = [...clientRuntimeRows].sort((left, right) => right.lastPingAt.localeCompare(left.lastPingAt))[0];

    return {
      ...client,
      portalName: latestRuntimeRow?.portalName ?? client.portalName,
      portalUrl: latestRuntimeRow?.portalUrl ?? client.portalUrl,
      buildVersion: latestRuntimeRow?.buildVersion ?? client.buildVersion,
      lastUpdated: latestRuntimeRow?.lastPingAt ?? client.lastUpdated,
      applications: [...updatedApplications, ...appendedApplications],
    };
  });

  const knownClientIds = new Set(clients.map((client) => client.id));
  const discoveredClients = [...runtimeByClient.entries()]
    .filter(([clientId]) => !knownClientIds.has(clientId))
    .map(([clientId, rows]) => {
      const latestRuntimeRow = [...rows].sort((left, right) => right.lastPingAt.localeCompare(left.lastPingAt))[0];
      return {
        id: clientId,
        name: latestRuntimeRow?.clientName ?? clientId,
        industry: "Unassigned",
        portalName: latestRuntimeRow?.portalName ?? clientId,
        portalUrl: latestRuntimeRow?.portalUrl ?? "",
        embeddedBasePath: "/portal",
        primaryContact: "Not set",
        notes: "Discovered from live portal heartbeat reporting.",
        ticketProvider: "Howell Monitor",
        buildVersion: latestRuntimeRow?.buildVersion ?? "portal-library@unknown",
        lastUpdated: latestRuntimeRow?.lastPingAt ?? new Date().toISOString(),
        applications: rows.map((row) => ({
          id: row.applicationId,
          name: row.applicationName ?? row.portalName,
          environment: row.environment ?? "Production",
          status: row.effectiveStatus,
          uptime: row.isStale ? "No recent ping" : "Heartbeat active",
          responseTime: formatRuntimeResponseTime(row),
          lastChecked: row.lastPingAt,
        })),
      } satisfies ClientRecord;
    });

  return [...mergedClients, ...discoveredClients];
}

async function getMergedClients() {
  const runtimeRows = await fetchRuntimeStatusRecords();
  return mergeClientsWithRuntime(runtimeRows);
}

export async function getClients() {
  return await getMergedClients();
}

export async function getClientById(clientId: string) {
  const mergedClients = await getMergedClients();
  return mergedClients.find((client) => client.id === clientId) ?? null;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  await waitForSimulatedDelay();
  const mergedClients = await getMergedClients();

  const applications = mergedClients.flatMap((client) => client.applications);

  return {
    totalClients: mergedClients.length,
    totalApplications: applications.length,
    liveApplications: applications.filter((app) => app.status === "live").length,
    degradedApplications: applications.filter((app) => app.status === "degraded").length,
    downApplications: applications.filter((app) => app.status === "down").length,
    ticketingProviders: [...new Set(mergedClients.map((client) => client.ticketProvider))],
    clientSummaries: mergedClients.map((client) => ({
      id: client.id,
      name: client.name,
      portalName: client.portalName,
      live: client.applications.filter((app) => app.status === "live").length,
      degraded: client.applications.filter((app) => app.status === "degraded").length,
      down: client.applications.filter((app) => app.status === "down").length,
      portalUrl: client.portalUrl,
    })),
    incidents,
  };
}

export async function getApplicationStatusRows() {
  const mergedClients = await getMergedClients();
  return mergedClients.flatMap((client) =>
    client.applications.map((application) => ({
      clientId: client.id,
      clientName: client.name,
      portalName: client.portalName,
      portalUrl: client.portalUrl,
      ticketProvider: client.ticketProvider,
      ...application,
    })),
  );
}

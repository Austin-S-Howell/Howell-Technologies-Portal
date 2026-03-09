import clientsData from "../data/clients.json";
import incidentsData from "../data/incidents.json";
import type { ClientRecord, DashboardSnapshot, IncidentRecord } from "../types";
import { waitForSimulatedDelay } from "./simulatedDelay";

const clients = clientsData as ClientRecord[];
const incidents = incidentsData as IncidentRecord[];

export async function getClients() {
  return clients;
}

export async function getClientById(clientId: string) {
  return clients.find((client) => client.id === clientId) ?? null;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  await waitForSimulatedDelay();

  const applications = clients.flatMap((client) => client.applications);

  return {
    totalClients: clients.length,
    totalApplications: applications.length,
    liveApplications: applications.filter((app) => app.status === "live").length,
    degradedApplications: applications.filter((app) => app.status === "degraded").length,
    downApplications: applications.filter((app) => app.status === "down").length,
    ticketingProviders: [...new Set(clients.map((client) => client.ticketProvider))],
    clientSummaries: clients.map((client) => ({
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
  return clients.flatMap((client) =>
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

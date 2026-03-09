import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClients } from "../services/mockPortalService";
import type { ClientRecord } from "../types";

export function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);

  useEffect(() => {
    void getClients().then(setClients);
  }, []);

  const totalApplications = clients.flatMap((client) => client.applications).length;
  const attentionClients = clients.filter((client) =>
    client.applications.some((application) => application.status !== "live"),
  ).length;
  const ticketProviders = new Set(clients.map((client) => client.ticketProvider)).size;

  return (
    <div className="page-grid premium-page">
      <section className="workspace-hero workspace-hero--cool">
        <div>
          <p className="eyebrow">Clients</p>
          <h1>Client portal inventory</h1>
          <p className="lead">
            A cleaner portfolio view for every Howell-managed portal, with operational context, package alignment, and fast
            access to the client record.
          </p>
          <div className="workspace-hero__chips">
            <span className="workspace-chip">{clients.length} clients</span>
            <span className="workspace-chip">{totalApplications} tracked apps</span>
            <span className="workspace-chip">{attentionClients} clients need attention</span>
          </div>
        </div>
        <div className="workspace-hero__aside">
          <span>Support providers</span>
          <strong>{ticketProviders}</strong>
          <p>Shared across the current client portfolio.</p>
        </div>
      </section>

      <section className="portfolio-grid">
        <div className="client-list client-list--premium">
          {clients.map((client) => {
            const live = client.applications.filter((application) => application.status === "live").length;
            const degraded = client.applications.filter((application) => application.status === "degraded").length;
            const down = client.applications.filter((application) => application.status === "down").length;

            return (
              <article key={client.id} className="client-portfolio-card">
                <div className="client-portfolio-card__header">
                  <div>
                    <p className="eyebrow">{client.industry}</p>
                    <h2>{client.name}</h2>
                    <p>{client.notes}</p>
                  </div>
                  <span className="workspace-pill">{client.buildVersion}</span>
                </div>

                <div className="client-portfolio-card__stats">
                  <span className="status-pill status-pill--live">{live} live</span>
                  <span className="status-pill status-pill--degraded">{degraded} degraded</span>
                  <span className="status-pill status-pill--down">{down} down</span>
                </div>

                <div className="client-list__meta">
                  <span>Portal: {client.portalName}</span>
                  <span>Contact: {client.primaryContact}</span>
                  <span>Provider: {client.ticketProvider}</span>
                  <Link to={`/clients/${client.id}`}>Inspect client</Link>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="portfolio-rail">
          <article className="portfolio-rail__card">
            <p className="eyebrow">Portfolio brief</p>
            <h2>Current posture</h2>
            <div className="dashboard-brief-list">
              <div className="dashboard-brief-item">
                <span>Highest load</span>
                <strong>{attentionClients > 0 ? "Review flagged clients" : "All clients stable"}</strong>
              </div>
              <div className="dashboard-brief-item">
                <span>Package baseline</span>
                <strong>`portal@0.1.0` is the current shared package target.</strong>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}

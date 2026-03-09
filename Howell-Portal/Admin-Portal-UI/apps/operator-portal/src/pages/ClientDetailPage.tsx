import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getClientById } from "../services/mockPortalService";
import type { ClientRecord } from "../types";

export function ClientDetailPage() {
  const { clientId = "" } = useParams();
  const [client, setClient] = useState<ClientRecord | null>(null);

  useEffect(() => {
    void getClientById(clientId).then(setClient);
  }, [clientId]);

  if (!client) {
    return (
      <div className="page-grid">
        <section className="content-card">
          <p>Client not found.</p>
          <Link to="/clients" className="text-link">
            Back to clients
          </Link>
        </section>
      </div>
    );
  }

  const live = client.applications.filter((application) => application.status === "live").length;
  const degraded = client.applications.filter((application) => application.status === "degraded").length;
  const down = client.applications.filter((application) => application.status === "down").length;

  return (
    <div className="page-grid premium-page">
      <section className="workspace-hero workspace-hero--deep">
        <div>
          <p className="eyebrow">{client.industry}</p>
          <h1>{client.name}</h1>
          <p className="lead">{client.notes}</p>
          <div className="workspace-hero__chips">
            <span className="workspace-chip">{client.portalName}</span>
            <span className="workspace-chip">{client.ticketProvider}</span>
          </div>
        </div>
        <div className="workspace-hero__actions">
          <Link to="/clients" className="dashboard-action">
            Back to clients
          </Link>
          <a href={client.portalUrl} target="_blank" rel="noreferrer" className="dashboard-action dashboard-action--primary">
            Open live portal
          </a>
        </div>
      </section>

      <section className="dashboard-metrics dashboard-metrics--three-up">
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">Applications</span>
          <strong>{client.applications.length}</strong>
          <p>Tracked services currently attached to this client portal.</p>
        </article>
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">Service posture</span>
          <strong>{down > 0 ? "Risk" : degraded > 0 ? "Watch" : "Stable"}</strong>
          <p>
            {live} live, {degraded} degraded, and {down} down.
          </p>
        </article>
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">Package alignment</span>
          <strong>{client.buildVersion}</strong>
          <p>Shared `Portal-Library` shell target for this client deployment.</p>
        </article>
      </section>

      <section className="detail-grid detail-grid--premium">
        <article className="dashboard-panel">
          <p className="eyebrow">Portal details</p>
          <div className="detail-list">
            <span>Portal name</span>
            <strong>{client.portalName}</strong>
            <span>Portal URL</span>
            <a href={client.portalUrl} target="_blank" rel="noreferrer">
              {client.portalUrl}
            </a>
            <span>Embedded base path</span>
            <strong>{client.embeddedBasePath}</strong>
            <span>Primary contact</span>
            <strong>{client.primaryContact}</strong>
            <span>Last updated</span>
            <strong>{new Date(client.lastUpdated).toLocaleString()}</strong>
          </div>
        </article>

        <article className="dashboard-panel">
          <p className="eyebrow">Package alignment</p>
          <h2>{client.buildVersion}</h2>
          <p className="lead">
            This client is expected to consume the shared `Portal-Library` shell package and provide its own application content.
          </p>
          <a href={client.portalUrl} target="_blank" rel="noreferrer" className="button-link">
            Open live portal
          </a>
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Applications</p>
            <h2>Current deployment state</h2>
          </div>
        </div>
        <div className="application-grid">
          {client.applications.map((application) => (
            <article key={application.id} className="application-card application-card--premium">
              <div className="application-card__header">
                <strong>{application.name}</strong>
                <span className={`status-pill status-pill--${application.status}`}>{application.status}</span>
              </div>
              <div className="detail-list detail-list--compact">
                <span>Environment</span>
                <strong>{application.environment}</strong>
                <span>Uptime</span>
                <strong>{application.uptime}</strong>
                <span>Response time</span>
                <strong>{application.responseTime}</strong>
                <span>Last checked</span>
                <strong>{new Date(application.lastChecked).toLocaleString()}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

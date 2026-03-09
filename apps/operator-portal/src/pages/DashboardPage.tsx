import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardSnapshot } from "../services/mockPortalService";
import type { DashboardSnapshot } from "../types";

function getPriorityLabel(snapshot: DashboardSnapshot) {
  if (snapshot.downApplications > 0) {
    return "Active outage";
  }
  if (snapshot.degradedApplications > 0) {
    return "Performance watch";
  }
  return "All systems stable";
}

export function DashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);

  useEffect(() => {
    void getDashboardSnapshot().then(setSnapshot);
  }, []);

  if (!snapshot) {
    return <p>Loading dashboard...</p>;
  }

  const attentionCount = snapshot.degradedApplications + snapshot.downApplications;
  const healthScore = Math.round((snapshot.liveApplications / snapshot.totalApplications) * 100);
  const priorityLabel = getPriorityLabel(snapshot);
  const clientsByRisk = [...snapshot.clientSummaries].sort((left, right) => {
    const leftRisk = left.down * 10 + left.degraded * 3;
    const rightRisk = right.down * 10 + right.degraded * 3;
    return rightRisk - leftRisk;
  });
  const topRiskClient = clientsByRisk[0];

  return (
    <div className="page-grid dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero__content">
          <p className="eyebrow eyebrow--light">Operations Dashboard</p>
          <h1>Howell command center</h1>
          <p className="dashboard-hero__lead">
            A streamlined control surface for client portals, live application health, and the issues that need attention first.
          </p>
          <div className="dashboard-hero__meta">
            <span className="dashboard-chip">{priorityLabel}</span>
            <span className="dashboard-chip">{snapshot.totalApplications} monitored applications</span>
          </div>
        </div>

        <div className="dashboard-hero__actions">
          <Link to="/status" className="dashboard-action dashboard-action--primary">
            Open application status
          </Link>
          <Link to="/clients" className="dashboard-action">
            Open client inventory
          </Link>
        </div>

        <div className="dashboard-snapshot dashboard-snapshot--hero">
          <article className="snapshot-card snapshot-card--hero">
            <span>Live</span>
            <strong>{snapshot.liveApplications}</strong>
          </article>
          <article className="snapshot-card snapshot-card--hero">
            <span>Degraded</span>
            <strong>{snapshot.degradedApplications}</strong>
          </article>
          <article className="snapshot-card snapshot-card--hero">
            <span>Down</span>
            <strong>{snapshot.downApplications}</strong>
          </article>
        </div>
      </section>

      <section className="dashboard-metrics">
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">Service health</span>
          <strong>{healthScore}%</strong>
          <p>Percentage of currently live tracked applications.</p>
        </article>
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">Attention needed</span>
          <strong>{attentionCount}</strong>
          <p>Applications requiring active review from Howell operations.</p>
        </article>
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">Client footprint</span>
          <strong>{snapshot.totalClients}</strong>
          <p>Client portals currently tracked by this control surface.</p>
        </article>
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">Providers</span>
          <strong>{snapshot.ticketingProviders.length}</strong>
          <p>Ticketing or support providers connected across clients.</p>
        </article>
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-panel dashboard-panel--priority">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Priority queue</p>
              <h2>What needs eyes right now</h2>
            </div>
            <span className="dashboard-meta">{priorityLabel}</span>
          </div>

          {snapshot.incidents[0] ? (
            <article className={`dashboard-spotlight dashboard-spotlight--${snapshot.incidents[0].severity}`}>
              <div>
                <p className="eyebrow">Primary incident</p>
                <h3>{snapshot.incidents[0].title}</h3>
                <p>{snapshot.incidents[0].summary}</p>
              </div>
              <span>{new Date(snapshot.incidents[0].timestamp).toLocaleString()}</span>
            </article>
          ) : (
            <article className="dashboard-spotlight dashboard-spotlight--stable">
              <div>
                <p className="eyebrow">Primary incident</p>
                <h3>No active incidents</h3>
                <p>All monitored applications are currently stable.</p>
              </div>
            </article>
          )}

          <div className="incident-list">
            {snapshot.incidents.map((incident) => (
              <article key={incident.id} className={`incident-card incident-card--${incident.severity}`}>
                <div>
                  <strong>{incident.title}</strong>
                  <p>{incident.summary}</p>
                </div>
                <span>{new Date(incident.timestamp).toLocaleString()}</span>
              </article>
            ))}
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Client health</p>
              <h2>Portfolio status</h2>
            </div>
            <Link to="/status" className="text-link">
              Open application status
            </Link>
          </div>
          <div className="client-health-list">
            {clientsByRisk.map((client) => {
              const total = client.live + client.degraded + client.down;
              const liveWidth = `${(client.live / total) * 100}%`;
              const degradedWidth = `${(client.degraded / total) * 100}%`;
              const downWidth = `${(client.down / total) * 100}%`;

              return (
              <article key={client.id} className="client-health-row">
                <div className="client-health-row__main">
                  <div>
                    <strong>{client.name}</strong>
                    <p>{client.portalName}</p>
                  </div>
                  <div className="health-counters">
                    <span className="status-pill status-pill--live">{client.live} live</span>
                    <span className="status-pill status-pill--degraded">{client.degraded} degraded</span>
                    <span className="status-pill status-pill--down">{client.down} down</span>
                  </div>
                </div>
                <div className="health-meter">
                  <span className="health-meter__segment health-meter__segment--live" style={{ width: liveWidth }} />
                  <span
                    className="health-meter__segment health-meter__segment--degraded"
                    style={{ width: degradedWidth }}
                  />
                  <span className="health-meter__segment health-meter__segment--down" style={{ width: downWidth }} />
                </div>
                <div className="client-health-card__links">
                  <Link to={`/clients/${client.id}`}>View client</Link>
                  <a href={client.portalUrl} target="_blank" rel="noreferrer">
                    Open portal
                  </a>
                </div>
              </article>
              );
            })}
          </div>

        </article>

        <aside className="dashboard-rail">
          <article className="dashboard-panel dashboard-panel--rail">
            <p className="eyebrow">Command view</p>
            <h2>Operator brief</h2>
            <div className="dashboard-brief-list">
              <div className="dashboard-brief-item">
                <span>Top priority</span>
                <strong>{priorityLabel}</strong>
              </div>
              <div className="dashboard-brief-item">
                <span>Incident count</span>
                <strong>{snapshot.incidents.length}</strong>
              </div>
              <div className="dashboard-brief-item">
                <span>Tracked providers</span>
                <strong>{snapshot.ticketingProviders.join(", ")}</strong>
              </div>
            </div>
          </article>

          <article className="dashboard-panel dashboard-panel--rail">
            <p className="eyebrow">Quick actions</p>
            <h2>Move fast</h2>
            <div className="dashboard-quick-links">
              <Link to="/status" className="dashboard-quick-link">
                Application status
              </Link>
              <Link to="/clients" className="dashboard-quick-link">
                Client records
              </Link>
              {topRiskClient ? (
                <Link to={`/clients/${topRiskClient.id}`} className="dashboard-quick-link">
                  Open riskiest client
                </Link>
              ) : null}
            </div>
          </article>
        </aside>
      </section>

      <section className="status-strip">
        <article className="status-strip__item">
          <span>Highest priority</span>
          <strong>{priorityLabel}</strong>
        </article>
        <article className="status-strip__item">
          <span>Healthy coverage</span>
          <strong>{healthScore}% service health</strong>
        </article>
        <article className="status-strip__item">
          <span>Escalation pressure</span>
          <strong>{attentionCount === 0 ? "Low" : attentionCount === 1 ? "Moderate" : "Elevated"}</strong>
        </article>
      </section>
    </div>
  );
}

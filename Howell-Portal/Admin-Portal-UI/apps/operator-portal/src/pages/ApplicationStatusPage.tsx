import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApplicationStatusRows } from "../services/mockPortalService";

interface StatusRow {
  clientId: string;
  clientName: string;
  portalName: string;
  portalUrl: string;
  ticketProvider: string;
  id: string;
  name: string;
  environment: string;
  status: "live" | "degraded" | "down";
  uptime: string;
  responseTime: string;
  lastChecked: string;
}

export function ApplicationStatusPage() {
  const [rows, setRows] = useState<StatusRow[]>([]);

  useEffect(() => {
    void getApplicationStatusRows().then(setRows);
  }, []);

  const live = rows.filter((row) => row.status === "live").length;
  const degraded = rows.filter((row) => row.status === "degraded").length;
  const down = rows.filter((row) => row.status === "down").length;

  return (
    <div className="page-grid premium-page">
      <section className="workspace-hero workspace-hero--cool">
        <div>
          <p className="eyebrow">Application Status</p>
          <h1>Live health view across all client apps</h1>
          <p className="lead">A streamlined board for current service posture, response times, and provider ownership.</p>
          <div className="workspace-hero__chips">
            <span className="workspace-chip">{rows.length} monitored apps</span>
            <span className="workspace-chip">{degraded + down} needing review</span>
          </div>
        </div>
        <div className="workspace-hero__aside">
          <span>Current posture</span>
          <strong>{down > 0 ? "Active outage" : degraded > 0 ? "Performance watch" : "Stable"}</strong>
          <p>Status is calculated from live portal heartbeats when available, with mock records as fallback.</p>
        </div>
      </section>

      <section className="status-strip">
        <article className="status-strip__item">
          <span>Live</span>
          <strong>{live}</strong>
        </article>
        <article className="status-strip__item">
          <span>Degraded</span>
          <strong>{degraded}</strong>
        </article>
        <article className="status-strip__item">
          <span>Down</span>
          <strong>{down}</strong>
        </article>
      </section>

      <section className="dashboard-panel status-board">
        <div className="status-table-shell">
          <div className="status-table">
            <div className="status-table__head">
              <span>Application</span>
              <span>Client</span>
              <span>Status</span>
              <span>Environment</span>
              <span>Response</span>
              <span>Tickets</span>
            </div>
            {rows.map((row) => (
              <div key={row.id} className="status-table__row">
                <div>
                  <strong>{row.name}</strong>
                  <span>{new Date(row.lastChecked).toLocaleString()}</span>
                </div>
                <div>
                  <Link to={`/clients/${row.clientId}`} className="status-table__client-link">
                    {row.clientName}
                  </Link>
                  <span>{row.portalName}</span>
                </div>
                <span className={`status-pill status-pill--${row.status}`}>{row.status}</span>
                <span>{row.environment}</span>
                <span>{row.responseTime}</span>
                <span>{row.ticketProvider}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

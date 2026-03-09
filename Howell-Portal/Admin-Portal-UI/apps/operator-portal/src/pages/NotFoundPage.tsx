import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="page-grid">
      <section className="content-card">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <Link to="/dashboard" className="text-link">
          Return to dashboard
        </Link>
      </section>
    </div>
  );
}

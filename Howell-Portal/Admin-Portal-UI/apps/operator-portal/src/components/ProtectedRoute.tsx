import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { HowellLogoSpinner } from "../components/HowellLogoSpinner";
import { getSession } from "../services/mockAuth";
import type { OperatorSession } from "../types";

export function ProtectedRoute() {
  const location = useLocation();
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const resolvedSession = await getSession();
      if (!cancelled) {
        setSession(resolvedSession);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="dashboard-loading-shell">
        <HowellLogoSpinner size="md" label="Checking session..." />
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

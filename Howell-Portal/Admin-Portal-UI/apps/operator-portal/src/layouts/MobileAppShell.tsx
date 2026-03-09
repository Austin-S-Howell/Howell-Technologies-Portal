import { Link, NavLink, Outlet } from "react-router-dom";
import howellLogo from "../assets/howell-logo.png";
import type { OperatorSession } from "../types";
import { shellNavigation } from "./shellNavigation";

type MobileAppShellProps = {
  session: OperatorSession | null;
  buildLabel: string;
  onLogout: () => void | Promise<void>;
};

export function MobileAppShell({ session, buildLabel, onLogout }: MobileAppShellProps) {
  const initials = session?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mobile-shell">
      <header className="mobile-shell__header">
        <Link to="/dashboard" className="mobile-shell__brand">
          <span className="mobile-shell__brand-mark">
            <img src={howellLogo} alt="Howell Technologies" />
          </span>
          <div>
            <strong>Howell Technologies</strong>
            <span>{`Admin Portal | ${buildLabel}`}</span>
          </div>
        </Link>
        <button onClick={onLogout} className="mobile-shell__logout" aria-label="Sign out">
          <i className="pi pi-sign-out" aria-hidden="true" />
        </button>
      </header>

      <section className="mobile-shell__operator" aria-label="Logged in user">
        <span className="mobile-shell__operator-avatar">{initials || "HT"}</span>
        <div className="mobile-shell__operator-meta">
          <p>{session?.name}</p>
          <span>{session?.role}</span>
        </div>
      </section>

      <nav className="mobile-shell__tabs" aria-label="Primary">
        {shellNavigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "mobile-shell__tab is-active" : "mobile-shell__tab")}
          >
            <i className={item.icon} aria-hidden="true" />
            <span>{item.shortLabel}</span>
          </NavLink>
        ))}
      </nav>

      <main className="mobile-shell__content">
        <Outlet />
      </main>
    </div>
  );
}

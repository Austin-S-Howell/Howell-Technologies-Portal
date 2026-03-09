import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import howellLogo from "../assets/howell-logo.png";
import type { OperatorSession } from "../types";
import { shellNavigation } from "./shellNavigation";

type MobileAppShellProps = {
  session: OperatorSession | null;
  buildLabel: string;
  onLogout: () => void | Promise<void>;
};

export function MobileAppShell({ session, buildLabel, onLogout }: MobileAppShellProps) {
  const location = useLocation();
  const mobileNavigation = [
    ...shellNavigation,
    { to: "/profile", label: "Profile", shortLabel: "Profile", icon: "pi pi-user" },
  ];
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
        <div className="mobile-shell__header-actions">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? "mobile-shell__avatar-link is-active" : "mobile-shell__avatar-link"
            }
            aria-label="Open profile settings"
          >
            <span>{initials || "HT"}</span>
          </NavLink>
          <button onClick={onLogout} className="mobile-shell__logout" aria-label="Sign out">
            <i className="pi pi-sign-out" aria-hidden="true" />
          </button>
        </div>
      </header>

      <nav className="mobile-shell__tabs" aria-label="Primary">
        {mobileNavigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "mobile-shell__tab is-active" : "mobile-shell__tab")}
          >
            <span className="mobile-shell__tab-icon">
              <i className={item.icon} aria-hidden="true" />
            </span>
            <span className="mobile-shell__tab-label">{item.shortLabel}</span>
          </NavLink>
        ))}
      </nav>

      <main className="mobile-shell__content">
        <section key={`${location.pathname}:${location.search}`} className="mobile-shell__page">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

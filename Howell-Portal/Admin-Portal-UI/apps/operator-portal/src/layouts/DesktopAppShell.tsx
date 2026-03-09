import { Link, NavLink, Outlet } from "react-router-dom";
import howellLogo from "../assets/howell-logo.png";
import type { OperatorSession } from "../types";
import { shellNavigation } from "./shellNavigation";

type DesktopAppShellProps = {
  session: OperatorSession | null;
  buildLabel: string;
  onLogout: () => void | Promise<void>;
};

export function DesktopAppShell({ session, buildLabel, onLogout }: DesktopAppShellProps) {
  const initials = session?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-shell">
      <header className="app-shell__topbar">
        <Link to="/dashboard" className="app-shell__brand">
          <span className="app-shell__brand-mark">
            <img src={howellLogo} alt="Howell Technologies" />
          </span>
          <div>
            <strong>Howell Technologies</strong>
            <span>{`Admin Portal | ${buildLabel}`}</span>
          </div>
        </Link>

        <nav className="app-shell__nav" aria-label="Primary">
          {shellNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "app-shell__nav-link is-active" : "app-shell__nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-shell__topbar-actions">
          <div className="app-shell__operator-inline">
            <span className="app-shell__operator-avatar">{initials || "HT"}</span>
            <div className="app-shell__operator-meta">
              <p>{session?.name}</p>
              <span>{session?.role}</span>
            </div>
          </div>
          <button onClick={onLogout} className="app-shell__logout">
            Sign out
          </button>
        </div>
      </header>

      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
}

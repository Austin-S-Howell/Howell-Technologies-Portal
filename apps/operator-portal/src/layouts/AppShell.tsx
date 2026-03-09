import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import howellLogo from "../assets/howell-logo.png";
import { logout } from "../services/mockAuth";
import { readSession } from "../services/sessionStorage";

const navigation = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/clients", label: "Clients" },
  { to: "/status", label: "Application Status" },
];

export function AppShell() {
  const session = readSession();
  const navigate = useNavigate();
  const initials = session?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="app-shell__topbar">
        <Link to="/dashboard" className="app-shell__brand">
          <span className="app-shell__brand-mark">
            <img src={howellLogo} alt="Howell Technologies" />
          </span>
          <div>
            <strong>Howell Technologies</strong>
            <span>Admin Portal</span>
          </div>
        </Link>

        <nav className="app-shell__nav" aria-label="Primary">
          {navigation.map((item) => (
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
          <button onClick={handleLogout} className="app-shell__logout">
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

import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import howellLogo from "../assets/howell-logo.png";
import type { OperatorSession } from "../types";
import { shellNavigation } from "./shellNavigation";

const INSTALL_PROMPT_DISMISS_KEY = "howell.mobile.installPromptDismissedAt.v1";
const INSTALL_PROMPT_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function shouldShowIosInstallPrompt() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  const userAgent = navigator.userAgent.toLowerCase();
  const isIphone = /iphone|ipod/.test(userAgent);
  const isSafari =
    userAgent.includes("safari") &&
    !/(crios|fxios|edgios|opios|gsa|duckduckgo)/.test(userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (typeof iosNavigator.standalone === "boolean" && iosNavigator.standalone === true);

  if (!isIphone || !isSafari || isStandalone) {
    return false;
  }

  try {
    const dismissedAt = Number(window.localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY) ?? "0");
    if (Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < INSTALL_PROMPT_DISMISS_MS) {
      return false;
    }
  } catch {
    // Ignore storage errors and continue with prompt visibility.
  }

  return true;
}

type MobileAppShellProps = {
  session: OperatorSession | null;
  buildLabel: string;
  onLogout: () => void | Promise<void>;
};

export function MobileAppShell({ session, buildLabel, onLogout }: MobileAppShellProps) {
  const location = useLocation();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showInstallSteps, setShowInstallSteps] = useState(false);
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

  useEffect(() => {
    setShowInstallPrompt(shouldShowIosInstallPrompt());
  }, []);

  function handleInstallNotNow() {
    try {
      window.localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, String(Date.now()));
    } catch {
      // Ignore storage failures; UI still dismisses for this view.
    }
    setShowInstallPrompt(false);
    setShowInstallSteps(false);
  }

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

      <main className="mobile-shell__content">
        {showInstallPrompt ? (
          <section className="mobile-install-prompt" role="status" aria-live="polite">
            <div className="mobile-install-prompt__head">
              <span className="mobile-install-prompt__icon">
                <i className="pi pi-mobile" aria-hidden="true" />
              </span>
              <div>
                <strong>Install HT Portal</strong>
                <p>Add this portal to your iPhone home screen for app-like access.</p>
              </div>
            </div>
            {showInstallSteps ? (
              <ol className="mobile-install-prompt__steps">
                <li>Tap the Share icon in Safari.</li>
                <li>Select Add to Home Screen.</li>
                <li>Tap Add in the top-right corner.</li>
              </ol>
            ) : null}
            <div className="mobile-install-prompt__actions">
              <button
                type="button"
                className="mobile-install-prompt__button mobile-install-prompt__button--primary"
                onClick={() => setShowInstallSteps((previous) => !previous)}
              >
                {showInstallSteps ? "Hide steps" : "Install"}
              </button>
              <button
                type="button"
                className="mobile-install-prompt__button mobile-install-prompt__button--secondary"
                onClick={handleInstallNotNow}
              >
                Not now
              </button>
            </div>
          </section>
        ) : null}

        <section key={`${location.pathname}:${location.search}`} className="mobile-shell__page">
          <Outlet />
        </section>
      </main>

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
    </div>
  );
}

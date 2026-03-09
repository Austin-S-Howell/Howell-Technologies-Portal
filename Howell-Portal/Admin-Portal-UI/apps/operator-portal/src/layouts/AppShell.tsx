import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOperatorPortalBuildLabel } from "../config/buildVersion";
import { DesktopAppShell } from "./DesktopAppShell";
import { MobileAppShell } from "./MobileAppShell";
import { logout } from "../services/mockAuth";
import { readSession } from "../services/sessionStorage";

const MOBILE_QUERY = "(max-width: 980px)";

function getIsMobile() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function AppShell() {
  const session = readSession();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const buildLabel = getOperatorPortalBuildLabel();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (isMobile) {
    return <MobileAppShell session={session} buildLabel={buildLabel} onLogout={handleLogout} />;
  }

  return <DesktopAppShell session={session} buildLabel={buildLabel} onLogout={handleLogout} />;
}

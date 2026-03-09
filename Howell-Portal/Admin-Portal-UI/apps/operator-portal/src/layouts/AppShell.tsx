import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOperatorPortalBuildLabel } from "../config/buildVersion";
import { DesktopAppShell } from "./DesktopAppShell";
import { MobileAppShell } from "./MobileAppShell";
import { logout } from "../services/mockAuth";
import { readSession } from "../services/sessionStorage";
import { detectClientEnvironment, MOBILE_QUERY } from "../utils/clientEnvironment";

export function AppShell() {
  const session = readSession();
  const navigate = useNavigate();
  const [clientEnvironment, setClientEnvironment] = useState(detectClientEnvironment);
  const buildLabel = getOperatorPortalBuildLabel();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mediaQuery = window.matchMedia(MOBILE_QUERY);

    const updateEnvironment = () => {
      setClientEnvironment(detectClientEnvironment());
    };

    const handleChange = () => {
      updateEnvironment();
    };

    updateEnvironment();
    window.addEventListener("resize", handleChange);
    window.addEventListener("orientationchange", handleChange);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
        window.removeEventListener("resize", handleChange);
        window.removeEventListener("orientationchange", handleChange);
      };
    }

    mediaQuery.addListener(handleChange);
    return () => {
      mediaQuery.removeListener(handleChange);
      window.removeEventListener("resize", handleChange);
      window.removeEventListener("orientationchange", handleChange);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.dataset.htDevice = clientEnvironment.deviceProfile;
    document.documentElement.dataset.htBrowser = clientEnvironment.browserFamily;
    document.documentElement.dataset.htInput = clientEnvironment.isTouchInput ? "touch" : "pointer";
  }, [clientEnvironment]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (clientEnvironment.deviceProfile === "mobile") {
    return <MobileAppShell session={session} buildLabel={buildLabel} onLogout={handleLogout} />;
  }

  return <DesktopAppShell session={session} buildLabel={buildLabel} onLogout={handleLogout} />;
}

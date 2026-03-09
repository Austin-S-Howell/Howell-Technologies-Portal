export type BrowserFamily =
  | "chrome"
  | "safari"
  | "firefox"
  | "edge"
  | "opera"
  | "samsung-internet"
  | "unknown";

export type DeviceProfile = "mobile" | "desktop";

export type ClientEnvironment = {
  browserFamily: BrowserFamily;
  deviceProfile: DeviceProfile;
  isTouchInput: boolean;
};

export const MOBILE_QUERY = "(max-width: 980px)";

function detectBrowserFamily(userAgent: string): BrowserFamily {
  const normalized = userAgent.toLowerCase();

  if (normalized.includes("edg/")) {
    return "edge";
  }
  if (normalized.includes("opr/") || normalized.includes("opera")) {
    return "opera";
  }
  if (normalized.includes("samsungbrowser/")) {
    return "samsung-internet";
  }
  if (normalized.includes("firefox/")) {
    return "firefox";
  }
  if (normalized.includes("chrome/") || normalized.includes("crios/")) {
    return "chrome";
  }
  if (normalized.includes("safari/")) {
    return "safari";
  }

  return "unknown";
}

function detectDeviceProfile(userAgent: string, viewportIsMobile: boolean, isTouchInput: boolean): DeviceProfile {
  if (viewportIsMobile) {
    return "mobile";
  }

  const normalized = userAgent.toLowerCase();
  if (/(android|iphone|ipad|ipod|mobile|windows phone)/.test(normalized)) {
    return "mobile";
  }

  // iPadOS Safari can present a desktop-like user agent.
  if (normalized.includes("macintosh") && isTouchInput) {
    return "mobile";
  }

  return "desktop";
}

export function detectClientEnvironment(): ClientEnvironment {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      browserFamily: "unknown",
      deviceProfile: "desktop",
      isTouchInput: false,
    };
  }

  const userAgent = navigator.userAgent ?? "";
  const viewportIsMobile =
    typeof window.matchMedia === "function" && window.matchMedia(MOBILE_QUERY).matches;
  const isTouchInput = navigator.maxTouchPoints > 0 || "ontouchstart" in window;

  return {
    browserFamily: detectBrowserFamily(userAgent),
    deviceProfile: detectDeviceProfile(userAgent, viewportIsMobile, isTouchInput),
    isTouchInput,
  };
}


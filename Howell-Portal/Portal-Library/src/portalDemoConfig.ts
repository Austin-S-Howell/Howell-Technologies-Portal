import type { PortalBranding, PortalNavigationItem, PortalSession } from "./types";

export const portalDemoBranding: PortalBranding = {
  companyName: "Riverbend Health",
  tagLine: "A Howell-managed portal shell embedded into the client app after login.",
  theme: {
    primary: "#304352",
    surface: "#f3f6fa",
    accent: "#d4dae3",
    text: "#1f2934",
    mutedText: "#5a6470",
  },
};

export const portalDemoSession: PortalSession = {
  id: "client-demo-user",
  name: "Morgan Lee",
  email: "morgan@riverbendhealth.example.com",
  role: "Operations Director",
};

export const portalDemoNavigation: PortalNavigationItem[] = [
  { id: "home", label: "Home", active: true },
  { id: "applications", label: "Applications", badge: "3" },
  { id: "knowledge", label: "Knowledge Base" },
];

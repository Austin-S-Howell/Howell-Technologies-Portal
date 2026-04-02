export type ShellNavigationItem = {
  to: string;
  label: string;
  shortLabel: string;
  icon: string;
};

export const shellNavigation: ShellNavigationItem[] = [
  { to: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: "pi pi-home" },
  { to: "/clients", label: "Clients", shortLabel: "Clients", icon: "pi pi-users" },
  { to: "/status", label: "Application Status", shortLabel: "Status", icon: "pi pi-chart-bar" },
  { to: "/ideas", label: "Ideas", shortLabel: "Ideas", icon: "pi pi-pencil" },
  { to: "/demo-workbench", label: "POC Generator", shortLabel: "POC", icon: "pi pi-compass" },
];

import type { PortalPanelProps, PortalShellProps, PortalStatusBadgeProps, PortalThemeTokens } from "./types";
export declare function usePortalTheme(): Required<PortalThemeTokens>;
export declare function PortalPanel({ eyebrow, title, children }: PortalPanelProps): import("react/jsx-runtime").JSX.Element;
export declare function PortalStatusBadge({ state, label }: PortalStatusBadgeProps): import("react/jsx-runtime").JSX.Element;
export declare function PortalShell({ branding, session, navigation, headline, subheadline, statusMessage, children, rightRail, sidebarFooter, onSignOut, monitoring, }: PortalShellProps): import("react/jsx-runtime").JSX.Element;

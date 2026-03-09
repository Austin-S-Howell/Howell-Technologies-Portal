import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState, } from "react";
import { usePortalHeartbeat } from "./runtimeStatus";
const defaultTheme = {
    primary: "#2d4659",
    surface: "#eef3f7",
    accent: "#d0d8df",
    text: "#172734",
    mutedText: "#5b6773",
};
const PortalThemeContext = createContext(defaultTheme);
function shadeHexColor(hexColor, percent) {
    const normalized = hexColor.replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        return hexColor;
    }
    const channel = (offset) => parseInt(normalized.slice(offset, offset + 2), 16);
    const clamp = (value) => Math.max(0, Math.min(255, value));
    const adjust = (value) => clamp(Math.round(value + (percent / 100) * 255));
    const toHex = (value) => adjust(value).toString(16).padStart(2, "0");
    return `#${toHex(channel(0))}${toHex(channel(2))}${toHex(channel(4))}`;
}
function initialsFromName(name) {
    if (!name) {
        return "PU";
    }
    return name
        .split(" ")
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();
}
function resolveTheme(theme) {
    return {
        primary: theme?.primary ?? defaultTheme.primary,
        surface: theme?.surface ?? defaultTheme.surface,
        accent: theme?.accent ?? defaultTheme.accent,
        text: theme?.text ?? defaultTheme.text,
        mutedText: theme?.mutedText ?? defaultTheme.mutedText,
    };
}
export function usePortalTheme() {
    return useContext(PortalThemeContext);
}
export function PortalPanel({ eyebrow, title, children }) {
    const theme = usePortalTheme();
    return (_jsxs("article", { style: {
            padding: 16,
            borderRadius: 14,
            border: `1px solid ${theme.accent}`,
            background: "rgba(255, 255, 255, 0.9)",
        }, children: [eyebrow ? _jsx("p", { style: headingEyebrowStyle(theme), children: eyebrow }) : null, title ? _jsx("h2", { style: { margin: eyebrow ? "8px 0 0" : 0, color: theme.text, fontSize: 24 }, children: title }) : null, _jsx("div", { style: { marginTop: eyebrow || title ? 12 : 0 }, children: children })] }));
}
export function PortalStatusBadge({ state, label }) {
    const theme = usePortalTheme();
    const palette = state === "live"
        ? { background: "rgba(27, 140, 98, 0.14)", color: "#1d7d59", border: "#87c7aa" }
        : state === "degraded"
            ? { background: "rgba(177, 104, 21, 0.12)", color: "#a05f1f", border: "#d5b27a" }
            : { background: "rgba(157, 52, 52, 0.12)", color: "#9d3434", border: "#db9f9f" };
    return (_jsxs("span", { style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            width: "fit-content",
            borderRadius: 999,
            padding: "6px 10px",
            border: `1px solid ${palette.border}`,
            background: palette.background,
            color: palette.color,
            fontWeight: 700,
            fontSize: 13,
        }, children: [_jsx("span", { "aria-hidden": "true", style: {
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: palette.color,
                    boxShadow: `0 0 0 3px ${shadeHexColor(theme.surface, 4)}`,
                } }), _jsx("span", { children: label ?? state })] }));
}
export function PortalShell({ branding, session, navigation = [], headline, subheadline, statusMessage, children, rightRail, sidebarFooter, onSignOut, monitoring, }) {
    const theme = useMemo(() => resolveTheme(branding.theme), [branding.theme]);
    const heartbeat = usePortalHeartbeat(monitoring);
    const [logoAspectRatio, setLogoAspectRatio] = useState(1);
    const logoLayout = useMemo(() => {
        if (logoAspectRatio > 1.25) {
            const frameHeight = 72;
            const frameWidth = Math.min(176, Math.max(124, Math.round(frameHeight * logoAspectRatio + 10)));
            return {
                frameWidth,
                frameHeight,
                imageWidth: frameWidth - 22,
                imageHeight: frameHeight - 18,
                borderRadius: 14,
            };
        }
        return {
            frameWidth: 84,
            frameHeight: 84,
            imageWidth: 66,
            imageHeight: 66,
            borderRadius: 16,
        };
    }, [logoAspectRatio]);
    useEffect(() => {
        if (!branding.logoUrl) {
            setLogoAspectRatio(1);
            return;
        }
        let cancelled = false;
        const image = new Image();
        image.onload = () => {
            if (cancelled) {
                return;
            }
            const ratio = image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : 1;
            setLogoAspectRatio(Number.isFinite(ratio) && ratio > 0 ? ratio : 1);
        };
        image.onerror = () => {
            if (!cancelled) {
                setLogoAspectRatio(1);
            }
        };
        image.src = branding.logoUrl;
        return () => {
            cancelled = true;
        };
    }, [branding.logoUrl]);
    const heartbeatStatus = heartbeat.lastSnapshot?.status ?? "live";
    return (_jsx(PortalThemeContext.Provider, { value: theme, children: _jsx("section", { style: rootStyle(theme), children: _jsxs("div", { style: shellStyle(), children: [_jsxs("aside", { style: sidebarStyle(theme), children: [_jsxs("div", { style: { display: "grid", gap: 14 }, children: [branding.logoUrl ? (_jsx("div", { style: {
                                            width: logoLayout.frameWidth,
                                            height: logoLayout.frameHeight,
                                            borderRadius: logoLayout.borderRadius,
                                            display: "grid",
                                            placeItems: "center",
                                            background: "rgba(255, 255, 255, 0.92)",
                                            border: `1px solid ${shadeHexColor(theme.primary, -16)}`,
                                            boxShadow: "0 10px 18px rgba(7, 28, 44, 0.22)",
                                        }, children: _jsx("img", { src: branding.logoUrl, alt: `${branding.companyName} logo`, style: {
                                                width: logoLayout.imageWidth,
                                                height: logoLayout.imageHeight,
                                                objectFit: "contain",
                                            } }) })) : null, _jsxs("div", { style: profileCardStyle(theme), children: [_jsx("span", { style: avatarStyle(theme), children: initialsFromName(session?.name) }), _jsxs("div", { style: { display: "grid", gap: 2 }, children: [_jsx("strong", { style: { color: "#f2f8fb", fontSize: 20 }, children: session?.name ?? "Portal User" }), _jsx("span", { style: { color: "rgba(222, 242, 248, 0.86)" }, children: session?.role ?? "Authenticated user" })] })] }), _jsx("nav", { style: { display: "grid", gap: 8 }, children: navigation.map((item) => {
                                            const sharedStyle = sidebarNavButtonStyle(theme, Boolean(item.active));
                                            const badge = item.badge ? _jsx("span", { style: navBadgeStyle(theme), children: item.badge }) : null;
                                            if (item.href) {
                                                return (_jsxs("a", { href: item.href, style: sharedStyle, children: [_jsx("span", { children: item.label }), badge] }, item.id));
                                            }
                                            return (_jsxs("button", { type: "button", onClick: (event) => {
                                                    event.preventDefault();
                                                    item.onSelect?.();
                                                }, style: sharedStyle, children: [_jsx("span", { children: item.label }), badge] }, item.id));
                                        }) })] }), _jsxs("div", { style: { display: "grid", gap: 10 }, children: [_jsx("strong", { style: { color: "#ebf6fa", fontSize: 30, letterSpacing: "0.01em", lineHeight: 1.1 }, children: branding.companyName }), branding.tagLine ? _jsx("p", { style: { margin: 0, color: "rgba(222, 242, 248, 0.9)" }, children: branding.tagLine }) : null, onSignOut ? (_jsx("button", { type: "button", onClick: onSignOut, style: sidebarSignOutButtonStyle(theme), children: _jsx("span", { children: "Sign Out" }) })) : null, sidebarFooter] })] }), _jsxs("main", { style: mainColumnStyle(), children: [_jsxs("header", { style: mainHeaderStyle(theme), children: [_jsxs("div", { children: [_jsx("p", { style: headingEyebrowStyle(theme), children: "Client Portal" }), _jsx("h1", { style: { margin: "8px 0 0", fontSize: "clamp(1.3rem, 2vw, 1.7rem)", color: theme.text }, children: headline }), subheadline ? _jsx("p", { style: { margin: "8px 0 0", color: theme.mutedText }, children: subheadline }) : null] }), statusMessage ? _jsx("p", { style: { margin: 0, color: theme.mutedText }, children: statusMessage }) : null] }), _jsx("div", { style: { display: "grid", gap: 16, alignContent: "start" }, children: children })] }), _jsxs("aside", { style: rightRailStyle(theme), children: [_jsx(PortalPanel, { eyebrow: "Session", title: session?.email ?? "No active session", children: _jsxs("div", { style: { display: "grid", gap: 8, color: theme.mutedText }, children: [_jsx("span", { children: session?.role ?? "Role not provided" }), _jsx("span", { children: branding.companyName })] }) }), monitoring ? (_jsx(PortalPanel, { eyebrow: "Heartbeat", title: "Portal runtime", children: _jsxs("div", { style: { display: "grid", gap: 10 }, children: [_jsx(PortalStatusBadge, { state: heartbeatStatus, label: heartbeatStatus === "live" ? "Reporting" : heartbeatStatus }), _jsx("span", { style: { color: theme.mutedText }, children: heartbeat.lastReportedAt
                                                ? `Last ping ${new Date(heartbeat.lastReportedAt).toLocaleString()}`
                                                : "Waiting for first heartbeat" }), heartbeat.lastError ? _jsx("span", { style: { color: "#9d3434" }, children: heartbeat.lastError }) : null] }) })) : null, rightRail] })] }) }) }));
}
function rootStyle(theme) {
    return {
        color: theme.text,
        background: theme.surface,
        minHeight: "100%",
        height: "100%",
        fontFamily: '"Manrope", "Segoe UI", sans-serif',
        borderRadius: 22,
        border: `1px solid ${theme.accent}`,
        boxShadow: "0 16px 36px rgba(18, 42, 58, 0.12)",
        overflow: "hidden",
    };
}
function shellStyle() {
    return {
        display: "grid",
        gridTemplateColumns: "240px minmax(0, 1fr) 300px",
        minHeight: "100%",
        height: "100%",
    };
}
function sidebarStyle(theme) {
    return {
        padding: "20px 16px",
        background: `linear-gradient(180deg, ${theme.primary} 0%, ${shadeHexColor(theme.primary, -24)} 100%)`,
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        gap: 18,
        color: "#e7f4f8",
        borderRight: `1px solid ${shadeHexColor(theme.primary, -30)}`,
    };
}
function mainColumnStyle() {
    return {
        padding: 16,
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 16,
        minWidth: 0,
        overflow: "auto",
    };
}
function mainHeaderStyle(theme) {
    return {
        borderRadius: 16,
        padding: 18,
        background: "rgba(255, 255, 255, 0.85)",
        border: `1px solid ${theme.accent}`,
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "flex-start",
    };
}
function rightRailStyle(theme) {
    return {
        borderLeft: `1px solid ${theme.accent}`,
        background: "rgba(255, 255, 255, 0.45)",
        padding: 16,
        display: "grid",
        alignContent: "start",
        gap: 14,
        overflow: "auto",
    };
}
function profileCardStyle(theme) {
    return {
        display: "grid",
        gridTemplateColumns: "54px 1fr",
        gap: 10,
        alignItems: "center",
        padding: 10,
        borderRadius: 14,
        border: `1px solid ${shadeHexColor(theme.primary, -16)}`,
        background: "rgba(255, 255, 255, 0.08)",
    };
}
function avatarStyle(theme) {
    return {
        width: 52,
        height: 52,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        fontWeight: 800,
        color: shadeHexColor(theme.primary, -35),
        background: "rgba(224, 246, 240, 0.9)",
    };
}
function sidebarNavButtonStyle(theme, active) {
    return {
        border: `1px solid ${active ? "rgba(196, 230, 241, 0.45)" : "transparent"}`,
        borderRadius: 12,
        background: active ? "rgba(207, 235, 245, 0.24)" : "transparent",
        color: "#edf8fc",
        textAlign: "left",
        textDecoration: "none",
        fontWeight: 700,
        padding: "12px 14px",
        cursor: "pointer",
        boxShadow: active ? "inset 0 1px 0 rgba(255, 255, 255, 0.1)" : "none",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    };
}
function navBadgeStyle(theme) {
    return {
        borderRadius: 999,
        padding: "2px 8px",
        fontSize: 12,
        background: "rgba(255, 255, 255, 0.14)",
        border: `1px solid ${shadeHexColor(theme.primary, -12)}`,
    };
}
function sidebarSignOutButtonStyle(theme) {
    return {
        border: `1px solid ${shadeHexColor(theme.primary, -14)}`,
        borderRadius: 10,
        width: "fit-content",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(255, 255, 255, 0.1)",
        color: "#edf8fc",
        fontWeight: 700,
        fontSize: 13,
        padding: "7px 10px",
        cursor: "pointer",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 4px 10px rgba(2, 20, 34, 0.14)",
    };
}
function headingEyebrowStyle(theme) {
    return {
        margin: 0,
        color: theme.mutedText,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: 700,
    };
}

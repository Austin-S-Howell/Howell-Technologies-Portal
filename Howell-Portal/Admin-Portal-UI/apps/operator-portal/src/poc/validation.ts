import type {
  CompanyPOCConfig,
  HomepageWidgetConfig,
  MultiViewConfig,
  MultiViewTile,
  PowerBIReportRef,
  PortalContent,
  PortalSession,
} from "@howell-technologies/portal";
import type { POCGeneratorState } from "./types";

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${path} must be a non-empty string.`);
  }
  return value;
}

function asBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${path} must be a boolean.`);
  }
  return value;
}

function asNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${path} must be a number.`);
  }
  return value;
}

function asStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array.`);
  }
  return value.map((entry, index) => asString(entry, `${path}[${index}]`));
}

function parseWidget(value: unknown, path: string): HomepageWidgetConfig {
  const item = asRecord(value, path);
  const type = asString(item.type, `${path}.type`);
  if (type !== "metric" && type !== "status" && type !== "text") {
    throw new Error(`${path}.type must be metric, status, or text.`);
  }
  const widget: HomepageWidgetConfig = {
    id: asString(item.id, `${path}.id`),
    title: asString(item.title, `${path}.title`),
    type,
    value: asString(item.value, `${path}.value`),
  };
  if (item.description !== undefined) {
    widget.description = asString(item.description, `${path}.description`);
  }
  if (item.tone !== undefined) {
    const tone = asString(item.tone, `${path}.tone`);
    if (tone !== "positive" && tone !== "neutral" && tone !== "warning") {
      throw new Error(`${path}.tone must be positive, neutral, or warning.`);
    }
    widget.tone = tone;
  }
  return widget;
}

function parseReport(value: unknown, path: string): PowerBIReportRef {
  const item = asRecord(value, path);
  const report: PowerBIReportRef = {
    reportId: asString(item.reportId, `${path}.reportId`),
    name: asString(item.name, `${path}.name`),
    embedUrl: asString(item.embedUrl, `${path}.embedUrl`),
  };
  if (item.groupId !== undefined) {
    report.groupId = asString(item.groupId, `${path}.groupId`);
  }
  if (item.description !== undefined) {
    report.description = asString(item.description, `${path}.description`);
  }
  if (item.workspaceName !== undefined) {
    report.workspaceName = asString(item.workspaceName, `${path}.workspaceName`);
  }
  if (item.lastUpdated !== undefined) {
    report.lastUpdated = asString(item.lastUpdated, `${path}.lastUpdated`);
  }
  return report;
}

function parseMultiViewTile(value: unknown, path: string): MultiViewTile {
  const item = asRecord(value, path);
  const tile: MultiViewTile = {
    id: asString(item.id, `${path}.id`),
    reportId: asString(item.reportId, `${path}.reportId`),
    title: asString(item.title, `${path}.title`),
    x: asNumber(item.x, `${path}.x`),
    y: asNumber(item.y, `${path}.y`),
    w: asNumber(item.w, `${path}.w`),
    h: asNumber(item.h, `${path}.h`),
  };
  if (item.groupId !== undefined) {
    tile.groupId = asString(item.groupId, `${path}.groupId`);
  }
  if (item.pageName !== undefined) {
    tile.pageName = asString(item.pageName, `${path}.pageName`);
  }
  return tile;
}

function parseMultiView(value: unknown, path: string): MultiViewConfig {
  const item = asRecord(value, path);
  if (!Array.isArray(item.tiles)) {
    throw new Error(`${path}.tiles must be an array.`);
  }
  const parsed: MultiViewConfig = {
    id: asString(item.id, `${path}.id`),
    name: asString(item.name, `${path}.name`),
    tiles: item.tiles.map((entry, index) => parseMultiViewTile(entry, `${path}.tiles[${index}]`)),
  };
  if (item.description !== undefined) {
    parsed.description = asString(item.description, `${path}.description`);
  }
  return parsed;
}

function parseSession(value: unknown, path: string): PortalSession {
  const item = asRecord(value, path);
  const parsed: PortalSession = {
    id: asString(item.id, `${path}.id`),
    name: asString(item.name, `${path}.name`),
    email: asString(item.email, `${path}.email`),
  };
  if (item.role !== undefined) {
    parsed.role = asString(item.role, `${path}.role`);
  }
  return parsed;
}

function parseContent(value: unknown, path: string): PortalContent {
  const item = asRecord(value, path);
  if (!Array.isArray(item.widgets)) {
    throw new Error(`${path}.widgets must be an array.`);
  }
  const parsed: PortalContent = {
    headline: asString(item.headline, `${path}.headline`),
    subheadline: asString(item.subheadline, `${path}.subheadline`),
    statusMessage: asString(item.statusMessage, `${path}.statusMessage`),
    widgets: item.widgets.map((entry, index) => parseWidget(entry, `${path}.widgets[${index}]`)),
  };
  if (item.announcements !== undefined) {
    parsed.announcements = asStringArray(item.announcements, `${path}.announcements`);
  }
  if (item.reportGoal !== undefined) {
    parsed.reportGoal = asString(item.reportGoal, `${path}.reportGoal`);
  }
  return parsed;
}

export function parseCompanyPOCConfig(value: unknown): CompanyPOCConfig {
  const root = asRecord(value, "config");
  const branding = asRecord(root.branding, "config.branding");
  const theme = asRecord(branding.theme, "config.branding.theme");
  const features = asRecord(root.features, "config.features");

  if (!Array.isArray(root.reports)) {
    throw new Error("config.reports must be an array.");
  }
  if (!Array.isArray(root.multiViews)) {
    throw new Error("config.multiViews must be an array.");
  }

  return {
    companyName: asString(root.companyName, "config.companyName"),
    audience: asString(root.audience, "config.audience"),
    branding: {
      companyName: asString(branding.companyName, "config.branding.companyName"),
      tagLine: branding.tagLine !== undefined ? asString(branding.tagLine, "config.branding.tagLine") : undefined,
      logoUrl: branding.logoUrl !== undefined ? asString(branding.logoUrl, "config.branding.logoUrl") : undefined,
      theme: {
        primary: theme.primary !== undefined ? asString(theme.primary, "config.branding.theme.primary") : undefined,
        surface: theme.surface !== undefined ? asString(theme.surface, "config.branding.theme.surface") : undefined,
        accent: theme.accent !== undefined ? asString(theme.accent, "config.branding.theme.accent") : undefined,
        text: theme.text !== undefined ? asString(theme.text, "config.branding.theme.text") : undefined,
        mutedText: theme.mutedText !== undefined ? asString(theme.mutedText, "config.branding.theme.mutedText") : undefined,
      },
    },
    features: {
      reports: asBoolean(features.reports, "config.features.reports"),
    },
    session: parseSession(root.session, "config.session"),
    content: parseContent(root.content, "config.content"),
    reports: root.reports.map((entry, index) => parseReport(entry, `config.reports[${index}]`)),
    multiViews: root.multiViews.map((entry, index) => parseMultiView(entry, `config.multiViews[${index}]`)),
  };
}

export function parsePOCStateFromUnknown(value: unknown): POCGeneratorState {
  const root = asRecord(value, "state");
  const config = parseCompanyPOCConfig(root.config);
  return {
    configName: asString(root.configName, "state.configName"),
    config,
  };
}

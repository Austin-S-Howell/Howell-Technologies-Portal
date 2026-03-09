import type { CompanyPOCConfig, PortalBuildResult } from "./types";

export function buildPortalFromConfig(config: CompanyPOCConfig): PortalBuildResult {
  return {
    branding: config.branding,
    features: config.features,
    session: config.session,
    adapter: {
      auth: {
        getSession: async () => config.session,
      },
      portalData: {
        getContent: async () => config.content,
      },
      reports: {
        getReports: async () => config.reports,
        getMultiViews: async () => config.multiViews,
      },
      powerBI: {
        getEmbedInfo: async ({ reportId, groupId, pageName }) => {
          const matched = config.reports.find((report) => report.reportId === reportId && report.groupId === groupId);
          return {
            reportId,
            groupId,
            pageName,
            embedUrl: matched?.embedUrl ?? "https://app.powerbi.com/reportEmbed",
            embedToken: "host-provided-embed-token",
            tokenExpiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          };
        },
      },
    },
  };
}

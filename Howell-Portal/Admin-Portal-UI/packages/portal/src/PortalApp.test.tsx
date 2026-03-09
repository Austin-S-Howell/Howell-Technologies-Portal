import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PortalApp, buildPortalFromConfig, createMockPortalAdapter } from "./index";

describe("PortalApp", () => {
  it("renders package-driven content from the adapter", async () => {
    render(
      <PortalApp
        branding={{ companyName: "Howell Technologies" }}
        features={{ reports: true }}
        adapter={createMockPortalAdapter()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Your portal command center")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Reports" }));
    expect(screen.getAllByText("Monthly KPI Snapshot").length).toBeGreaterThan(0);
    expect(screen.getByText("Executive morning brief")).toBeInTheDocument();
  });

  it("builds PortalApp inputs from CompanyPOCConfig", async () => {
    const built = buildPortalFromConfig({
      companyName: "Acme Corp",
      audience: "Operations leadership",
      branding: {
        companyName: "Acme Corp",
        tagLine: "One pane of glass for clients",
      },
      features: { reports: true },
      session: {
        id: "u-1",
        name: "Alex Admin",
        email: "alex@acme.example",
        role: "Administrator",
      },
      content: {
        headline: "Acme Operations Portal",
        subheadline: "Track uptime and reports from one workspace.",
        statusMessage: "Stable",
        reportGoal: "Daily executive brief.",
        widgets: [{ id: "w1", title: "Availability", type: "metric", value: "99.9%" }],
      },
      reports: [
        {
          reportId: "r-1",
          name: "Operations Snapshot",
          embedUrl: "https://app.powerbi.com/reportEmbed?reportId=r-1",
        },
      ],
      multiViews: [{ id: "mv-1", name: "Morning", tiles: [{ id: "t1", reportId: "r-1", title: "Main", x: 0, y: 0, w: 12, h: 4 }] }],
    });

    render(<PortalApp {...built} basePath="/portal" />);
    expect(await screen.findByText("Acme Operations Portal")).toBeInTheDocument();
  });
});

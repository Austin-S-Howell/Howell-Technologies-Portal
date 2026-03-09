import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PortalApp, createMockPortalAdapter } from "./index";

describe("PortalApp", () => {
  it("renders package-driven content from the adapter", async () => {
    render(
      <PortalApp
        branding={{ companyName: "Howell Technologies" }}
        features={{ reports: true, tickets: true, documents: true }}
        adapter={createMockPortalAdapter()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Your portal command center")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Reports" }));
    expect(screen.getByText("Monthly KPIs")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tickets" }));
    expect(screen.getByText("Tech Connect")).toBeInTheDocument();
  });
});

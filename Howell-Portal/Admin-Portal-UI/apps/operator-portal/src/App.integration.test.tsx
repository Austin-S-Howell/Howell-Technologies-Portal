import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import { clearSession, writeSession } from "./services/sessionStorage";

describe("App routing", () => {
  afterEach(() => {
    cleanup();
    clearSession();
    window.history.replaceState({}, "", "/");
  });

  it("renders protected /demo-workbench with top nav entry", async () => {
    writeSession({
      id: "u-1",
      email: "admin@howelltechnologies.com",
      name: "Howell Admin",
      role: "Admin",
    });
    window.history.pushState({}, "", "/demo-workbench");

    render(<App />);

    expect(await screen.findByRole("link", { name: "POC Generator" })).toBeInTheDocument();
    expect(await screen.findByText("Company proof-of-concept builder")).toBeInTheDocument();
  });

  it("renders the ideas whiteboard route", async () => {
    writeSession({
      id: "u-2",
      email: "admin@howelltechnologies.com",
      name: "Howell Admin",
      role: "Admin",
    });
    window.history.pushState({}, "", "/ideas");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Ideas whiteboard" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Ideas" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Refresh board" })).toBeInTheDocument();
  });
});

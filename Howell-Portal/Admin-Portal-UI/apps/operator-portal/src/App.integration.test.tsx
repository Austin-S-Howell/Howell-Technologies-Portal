import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import { clearSession, writeSession } from "./services/sessionStorage";

describe("App routing", () => {
  afterEach(() => {
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
});

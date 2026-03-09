import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("client portal demo", () => {
  it("renders the shared PortalApp with branded content", async () => {
    render(<App />);

    expect(await screen.findByText("Riverbend Care Hub")).toBeInTheDocument();
  });
});

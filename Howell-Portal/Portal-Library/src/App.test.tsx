import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("portal library preview", () => {
  it("renders the reusable portal shell preview", async () => {
    render(<App />);

    expect(await screen.findByText("Riverbend Care Hub")).toBeInTheDocument();
    expect(await screen.findByText("Current authenticated view")).toBeInTheDocument();
  });
});

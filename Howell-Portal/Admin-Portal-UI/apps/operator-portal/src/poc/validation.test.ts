import { describe, expect, it } from "vitest";
import { createDefaultPOCConfig } from "./defaults";
import { parseCompanyPOCConfig } from "./validation";

describe("POC config validation", () => {
  it("accepts valid config shapes", () => {
    const config = createDefaultPOCConfig();
    expect(parseCompanyPOCConfig(config).companyName).toBe(config.companyName);
  });

  it("rejects invalid widget shape", () => {
    const invalid = createDefaultPOCConfig() as unknown as Record<string, unknown>;
    const content = invalid.content as Record<string, unknown>;
    content.widgets = [{ id: "x", type: "metric", value: "3" }];

    expect(() => parseCompanyPOCConfig(invalid)).toThrow("config.content.widgets[0].title");
  });

  it("rejects invalid report array entries", () => {
    const invalid = createDefaultPOCConfig() as unknown as Record<string, unknown>;
    invalid.reports = [{ name: "bad report" }];

    expect(() => parseCompanyPOCConfig(invalid)).toThrow("config.reports[0].reportId");
  });
});

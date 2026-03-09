import { describe, expect, it } from "vitest";
import { getDashboardSnapshot } from "./mockPortalService";

describe("mockPortalService", () => {
  it("aggregates dashboard totals from mock data", async () => {
    const snapshot = await getDashboardSnapshot();

    expect(snapshot.totalClients).toBe(3);
    expect(snapshot.liveApplications).toBe(4);
    expect(snapshot.degradedApplications).toBe(1);
    expect(snapshot.downApplications).toBe(1);
  });
});

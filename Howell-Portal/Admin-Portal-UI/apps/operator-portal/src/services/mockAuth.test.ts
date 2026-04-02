import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, readSession } from "./sessionStorage";

const originalFetch = globalThis.fetch;

describe("mockAuth", () => {
  beforeEach(() => {
    clearSession();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    clearSession();
    window.sessionStorage.clear();
    globalThis.fetch = originalFetch;
    vi.doUnmock("./supabaseOperatorAuth");
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("rejects login when no auth provider is configured", async () => {
    const { login } = await import("./mockAuth");
    await expect(login("austin@howelltechnologies.com", "admin")).rejects.toThrow("Operator login is not configured.");
  });

  it("uses backend operator auth when backend integration is enabled", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_STATIC_FE_ONLY", "false");
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "backend-user",
          email: "austin@howelltechnologies.com",
          name: "Austin Howell",
          role: "Administrator",
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const { login } = await import("./mockAuth");
    const session = await login("austin@howelltechnologies.com", "admin");

    expect(session.email).toBe("austin@howelltechnologies.com");
    expect(readSession()?.email).toBe("austin@howelltechnologies.com");
  });

  it("surfaces backend auth failures", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_STATIC_FE_ONLY", "false");
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Login failed: Incorrect username/password combo." }), {
        status: 401,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const { login } = await import("./mockAuth");
    await expect(login("austin@howelltechnologies.com", "admin")).rejects.toThrow(
      "Login failed: Incorrect username/password combo.",
    );
  });

  it("uses Supabase table auth when configured", async () => {
    vi.resetModules();
    vi.doMock("./supabaseOperatorAuth", () => ({
      isSupabaseOperatorAuthEnabled: () => true,
      loginWithSupabaseOperator: vi.fn().mockResolvedValue({
        id: "supabase-user",
        email: "brian@howelltechnologies.com",
        name: "Brian Howell",
        role: "Administrator",
      }),
    }));

    const { login } = await import("./mockAuth");
    const session = await login("brian@howelltechnologies.com", "admin");

    expect(session.email).toBe("brian@howelltechnologies.com");
    expect(readSession()?.email).toBe("brian@howelltechnologies.com");
  });

  it("persists the operator session in browser session storage", async () => {
    vi.resetModules();
    vi.doMock("./supabaseOperatorAuth", () => ({
      isSupabaseOperatorAuthEnabled: () => true,
      loginWithSupabaseOperator: vi.fn().mockResolvedValue({
        id: "supabase-user",
        email: "austin@howelltechnologies.com",
        name: "Austin Howell",
        role: "Administrator",
      }),
    }));

    const { login } = await import("./mockAuth");
    await login("austin@howelltechnologies.com", "admin");
    expect(window.sessionStorage.getItem("ht.operatorPortal.operatorSession.v1")).toContain(
      "austin@howelltechnologies.com",
    );
  });
});

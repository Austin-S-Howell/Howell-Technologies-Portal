import { describe, expect, it } from "vitest";
import { login } from "./mockAuth";

describe("mockAuth", () => {
  it("accepts valid mock credentials", async () => {
    const session = await login("austin@howelltechnologies.com", "admin");

    expect(session.email).toBe("austin@howelltechnologies.com");
  });

  it("rejects invalid credentials", async () => {
    await expect(login("austin@howelltechnologies.com", "wrong-password")).rejects.toThrow(
      "Invalid mock credentials.",
    );
  });
});

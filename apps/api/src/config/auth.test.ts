import { describe, expect, it } from "vitest";

import { authConfig } from "@/config/auth.js";

describe("authConfig", () => {
  it("has canonical access token TTL of 15 minutes", () => {
    expect(authConfig.accessTokenTtlMinutes).toBe(15);
  });

  it("has refresh cookie name set", () => {
    expect(authConfig.refreshCookieName).toBe("coremd_refresh_token");
  });

  it("has refresh cookie path versioned", () => {
    expect(authConfig.refreshCookiePath).toBe("/api/v1/auth");
  });

  it("has refresh session TTL of 30 days", () => {
    expect(authConfig.refreshSessionTtlDays).toBe(30);
  });

  it("has step-up TTL of 15 minutes", () => {
    expect(authConfig.stepUpTtlMinutes).toBe(15);
  });
});

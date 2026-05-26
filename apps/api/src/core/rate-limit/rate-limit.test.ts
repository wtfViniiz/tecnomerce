import { describe, expect, it } from "vitest";

import { buildSecureRefreshContext } from "@/core/rate-limit/rate-limit.middleware.js";
import { sha256 } from "@/core/security/crypto.util.js";

describe("buildSecureRefreshContext", () => {
  it("produces deterministic output for the same input", () => {
    const input = {
      userId: "user-1",
      sessionId: "session-1",
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0"
    };

    const a = buildSecureRefreshContext(input);
    const b = buildSecureRefreshContext(input);

    expect(a).toBe(b);
  });

  it("contains userId and sessionId", () => {
    const result = buildSecureRefreshContext({
      userId: "user-abc",
      sessionId: "session-xyz",
      ipAddress: "10.0.0.1",
      userAgent: "TestAgent"
    });

    expect(result).toContain("user-abc");
    expect(result).toContain("session-xyz");
  });

  it("hashes IP and userAgent", () => {
    const result = buildSecureRefreshContext({
      userId: "u",
      sessionId: "s",
      ipAddress: "192.168.1.1",
      userAgent: "Bot/1.0"
    });

    const hashedIp = sha256("192.168.1.1");
    const hashedUa = sha256("Bot/1.0");

    expect(result).toContain(hashedIp);
    expect(result).toContain(hashedUa);
    expect(result).not.toContain("192.168.1.1");
    expect(result).not.toContain("Bot/1.0");
  });

  it("changes when IP changes", () => {
    const base = {
      userId: "u",
      sessionId: "s",
      userAgent: "same"
    };

    const a = buildSecureRefreshContext({ ...base, ipAddress: "1.1.1.1" });
    const b = buildSecureRefreshContext({ ...base, ipAddress: "2.2.2.2" });

    expect(a).not.toBe(b);
  });
});

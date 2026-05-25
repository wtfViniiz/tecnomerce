import { describe, expect, it } from "vitest";

import { JwtTokenProvider } from "@/providers/token.provider.js";

describe("JwtTokenProvider", () => {
  it("creates deterministic lookup hashes and verifies argon refresh hashes", async () => {
    const provider = new JwtTokenProvider();
    const rawToken = await provider.generateRefreshToken();

    const lookupHashA = await provider.generateRefreshTokenLookupHash(rawToken);
    const lookupHashB = await provider.generateRefreshTokenLookupHash(rawToken);
    const refreshHash = await provider.hashRefreshToken(rawToken);
    const matches = await provider.verifyRefreshTokenHash(rawToken, refreshHash);

    expect(lookupHashA).toBe(lookupHashB);
    expect(matches).toBe(true);
  });

  it("signs and verifies access tokens with the canonical claims", async () => {
    const provider = new JwtTokenProvider();

    const accessToken = await provider.signAccessToken({
      sub: "user-1",
      sessionId: "session-1",
      tokenVersion: 3,
      permissionsVersion: 9,
      traceId: "trace-1"
    });

    const payload = await provider.verifyAccessToken(accessToken);

    expect(payload.sub).toBe("user-1");
    expect(payload.sessionId).toBe("session-1");
    expect(payload.tokenVersion).toBe(3);
    expect(payload.permissionsVersion).toBe(9);
    expect(payload.traceId).toBe("trace-1");
  });
});

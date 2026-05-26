import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/core/security/password.util.js";

describe("password.util", () => {
  it("hashes and verifies password correctly", async () => {
    const password = "StrongP@ss123!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toContain("$argon2id$");

    const valid = await verifyPassword(hash, password);
    expect(valid).toBe(true);
  });

  it("rejects incorrect password", async () => {
    const hash = await hashPassword("correct-password");
    const valid = await verifyPassword(hash, "wrong-password");
    expect(valid).toBe(false);
  });

  it("produces different hashes for same input (random salt)", async () => {
    const password = "same-password";
    const a = await hashPassword(password);
    const b = await hashPassword(password);

    expect(a).not.toBe(b);

    expect(await verifyPassword(a, password)).toBe(true);
    expect(await verifyPassword(b, password)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { encryptSensitive, decryptSensitive, sha256 } from "@/core/security/crypto.util.js";

describe("crypto.util", () => {
  describe("sha256", () => {
    it("produces a 64-char hex string", () => {
      const hash = sha256("test");
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it("is deterministic", () => {
      expect(sha256("same")).toBe(sha256("same"));
    });

    it("produces different hashes for different inputs", () => {
      expect(sha256("a")).not.toBe(sha256("b"));
    });
  });

  describe("encryptSensitive / decryptSensitive", () => {
    it("round-trips plaintext correctly", () => {
      const plaintext = "my-secret-value-123";
      const encrypted = encryptSensitive(plaintext);
      const decrypted = decryptSensitive(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    it("produces different ciphertext each time (random IV)", () => {
      const plaintext = "same-plaintext";
      const a = encryptSensitive(plaintext);
      const b = encryptSensitive(plaintext);

      expect(a).not.toBe(b);
      expect(decryptSensitive(a)).toBe(decryptSensitive(b));
    });

    it("fails to decrypt with tampered data", () => {
      const encrypted = encryptSensitive("secret");
      const tampered = encrypted.slice(0, -4) + "XXXX";

      expect(() => decryptSensitive(tampered)).toThrow();
    });
  });
});

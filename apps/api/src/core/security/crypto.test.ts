import { describe, expect, it } from "vitest";

import { sha256, encryptSensitive, decryptSensitive } from "@/core/security/crypto.util.js";

describe("Crypto utilities", () => {
  describe("sha256", () => {
    it("produces a deterministic hex hash", () => {
      const hash1 = sha256("hello");
      const hash2 = sha256("hello");

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("produces different hashes for different inputs", () => {
      expect(sha256("a")).not.toBe(sha256("b"));
    });

    it("produces a 64-character hex string", () => {
      expect(sha256("test")).toHaveLength(64);
    });
  });

  describe("encryptSensitive / decryptSensitive", () => {
    it("encrypts and decrypts a string round-trip", () => {
      const plaintext = "my-secret-totp-seed-123456";
      const encrypted = encryptSensitive(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain(".");

      const decrypted = decryptSensitive(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("produces different ciphertexts each time (random IV)", () => {
      const plaintext = "same-secret";
      const enc1 = encryptSensitive(plaintext);
      const enc2 = encryptSensitive(plaintext);

      expect(enc1).not.toBe(enc2);
      expect(decryptSensitive(enc1)).toBe(plaintext);
      expect(decryptSensitive(enc2)).toBe(plaintext);
    });

    it("throws on invalid ciphertext format", () => {
      expect(() => decryptSensitive("invalid-format")).toThrow(/invalid/i);
      expect(() => decryptSensitive("a.b")).toThrow(/invalid/i);
    });

    it("throws on tampered ciphertext", () => {
      const encrypted = encryptSensitive("secret");
      const parts = encrypted.split(".");
      parts[2] = Buffer.from("tampered").toString("base64");
      const tampered = parts.join(".");

      expect(() => decryptSensitive(tampered)).toThrow();
    });
  });
});

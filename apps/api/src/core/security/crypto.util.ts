import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { env } from "@/config/env.js";

const encryptionKey = Buffer.from(env.TWO_FA_ENCRYPTION_KEY, "base64");

if (encryptionKey.length !== 32) {
  throw new Error("TWO_FA_ENCRYPTION_KEY must be base64-encoded 32 bytes.");
}

export const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

export const encryptSensitive = (plainText: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
};

export const decryptSensitive = (cipherText: string): string => {
  const [ivPart, tagPart, encryptedPart] = cipherText.split(".");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("Invalid encrypted payload format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    Buffer.from(ivPart, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
};

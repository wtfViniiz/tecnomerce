import pino, { type Logger } from "pino";

import { env } from "@/config/env.js";

export const logger: Logger = pino({
  name: "@coremd/api",
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "request.headers.authorization",
      "request.headers.cookie",
      "password",
      "passwordHash",
      "refreshToken",
      "refreshTokenHash",
      "previousRefreshTokenHash",
      "twoFaSecret",
      "twoFaBackupHashes",
      "token",
      "secret"
    ],
    censor: "[REDACTED]"
  }
});

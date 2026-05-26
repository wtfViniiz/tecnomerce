import { env } from "@/config/env.js";

const prefix = `coremd:${env.APP_ENV}:`;

export const redisKeys = {
  sessions: `${prefix}sessions:`,
  permissions: `${prefix}permissions:`,
  ratelimit: `${prefix}ratelimit:`,
  sse: `${prefix}sse:`,
  queue: `${prefix}queue:`,
  public: `${prefix}public:`
} as const;

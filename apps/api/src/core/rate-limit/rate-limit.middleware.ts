import type { NextFunction, Request, Response } from "express";

import { redisKeys } from "@/config/redis-keys.js";
import { RateLimitError } from "@/core/errors/rate-limit-error.js";
import { sha256 } from "@/core/security/crypto.util.js";
import { redis } from "@/providers/redis.js";

type RateLimitOptions = {
  key: (request: Request) => string | null;
  limit: number;
  windowSeconds: number;
  code: string;
};

export const createRateLimitMiddleware =
  (options: RateLimitOptions) =>
  async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    const baseKey = options.key(request);
    if (!baseKey) {
      next();
      return;
    }

    const key = `${redisKeys.ratelimit}${options.code}:${baseKey}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, options.windowSeconds);
    }

    if (count > options.limit) {
      next(new RateLimitError(options.code, "Too many requests."));
      return;
    }

    next();
  };

export const buildSecureRefreshContext = (input: {
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}): string =>
  [
    input.userId,
    input.sessionId,
    sha256(input.ipAddress),
    sha256(input.userAgent)
  ].join(":");

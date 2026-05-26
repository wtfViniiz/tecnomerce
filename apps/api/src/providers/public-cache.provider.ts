import { redisKeys } from "@/config/redis-keys.js";
import type { IPublicCacheProvider } from "@/providers/contracts.js";
import { redis } from "@/providers/redis.js";

export class RedisPublicCacheProvider implements IPublicCacheProvider {
  private readonly prefix = `${redisKeys.public}cache:`;

  public async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(`${this.prefix}${key}`);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  }

  public async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await redis.set(
      `${this.prefix}${key}`,
      JSON.stringify(value),
      "EX",
      ttlSeconds
    );
  }

  public async invalidate(key: string): Promise<void> {
    await redis.del(`${this.prefix}${key}`);
  }

  public async invalidatePattern(pattern: string): Promise<void> {
    const cursor = "0";
    let scanCursor = cursor;

    do {
      const [nextCursor, keys] = await redis.scan(
        scanCursor,
        "MATCH",
        `${this.prefix}${pattern}`,
        "COUNT",
        100
      );

      scanCursor = nextCursor;

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (scanCursor !== "0");
  }
}

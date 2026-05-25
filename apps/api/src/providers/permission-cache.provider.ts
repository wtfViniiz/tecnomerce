import { env } from "@/config/env.js";
import { redisKeys } from "@/config/redis-keys.js";
import type { IPermissionCacheProvider } from "@/providers/contracts.js";
import { redis } from "@/providers/redis.js";

export class RedisPermissionCacheProvider implements IPermissionCacheProvider {
  public async get(key: string): Promise<string[] | null> {
    const raw = await redis.get(`${redisKeys.permissions}${key}`);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as string[];
  }

  public async set(key: string, permissions: string[], ttlSeconds = env.PERMISSION_CACHE_TTL_SECONDS): Promise<void> {
    await redis.set(
      `${redisKeys.permissions}${key}`,
      JSON.stringify(permissions),
      "EX",
      ttlSeconds
    );
  }

  public async delete(key: string): Promise<void> {
    await redis.del(`${redisKeys.permissions}${key}`);
  }
}

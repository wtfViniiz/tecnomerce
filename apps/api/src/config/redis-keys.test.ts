import { describe, expect, it } from "vitest";

import { redisKeys } from "@/config/redis-keys.js";

describe("redisKeys", () => {
  it("has correct namespace structure with prefix", () => {
    expect(redisKeys.sessions).toMatch(/^coremd:.+:sessions:$/);
    expect(redisKeys.permissions).toMatch(/^coremd:.+:permissions:$/);
    expect(redisKeys.ratelimit).toMatch(/^coremd:.+:ratelimit:$/);
    expect(redisKeys.sse).toMatch(/^coremd:.+:sse:$/);
    expect(redisKeys.queue).toMatch(/^coremd:.+:queue:$/);
    expect(redisKeys.public).toMatch(/^coremd:.+:public:$/);
  });

  it("defines exactly 6 key namespaces", () => {
    expect(Object.keys(redisKeys)).toHaveLength(6);
  });

  it("all values are strings ending with colon", () => {
    for (const value of Object.values(redisKeys)) {
      expect(typeof value).toBe("string");
      expect(value.endsWith(":")).toBe(true);
    }
  });
});

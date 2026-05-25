import { describe, expect, it } from "vitest";

import { HealthController } from "@/modules/health/controllers/health.controller.js";

describe("HealthController", () => {
  it("returns the canonical health envelope", async () => {
    const controller = new HealthController({
      checkDatabase: async () => "up",
      checkRedis: async () => "up"
    });

    let jsonPayload: unknown;
    await controller.handle(
      {
        context: { traceId: "trace-123", requestId: "request-123" }
      } as never,
      {
        json: (payload: unknown) => {
          jsonPayload = payload;
        }
      } as never
    );

    expect(jsonPayload).toEqual({
      status: "success",
      data: {
        status: "ok",
        services: {
          database: "up",
          redis: "up"
        }
      },
      error: null,
      traceId: "trace-123"
    });
  });
});

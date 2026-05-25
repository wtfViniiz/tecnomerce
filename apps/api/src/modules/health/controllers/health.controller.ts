import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";

export type HealthControllerDeps = {
  checkDatabase: () => Promise<"up" | "down">;
  checkRedis: () => Promise<"up" | "down">;
};

export class HealthController {
  public constructor(private readonly deps: HealthControllerDeps) {}

  public handle = async (request: Request, response: Response): Promise<void> => {
    const [database, redis] = await Promise.all([
      this.deps.checkDatabase(),
      this.deps.checkRedis()
    ]);

    response.json(
      successResponse(request.context.traceId, {
        status: "ok",
        services: {
          database,
          redis
        }
      })
    );
  };
}

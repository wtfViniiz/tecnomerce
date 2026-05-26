import type { Request, Response, NextFunction } from "express";

import { httpRequestDuration, httpRequestsTotal } from "@/core/metrics/metrics.js";

export const createMetricsMiddleware = () => {
  return (request: Request, response: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint();

    response.on("finish", () => {
      const end = process.hrtime.bigint();
      const durationSeconds = Number(end - start) / 1e9;

      const route = request.route?.path ?? request.path ?? "unknown";
      const method = request.method;
      const statusCode = String(response.statusCode);

      httpRequestDuration.labels(method, route, statusCode).observe(durationSeconds);
      httpRequestsTotal.labels(method, route, statusCode).inc();
    });

    next();
  };
};

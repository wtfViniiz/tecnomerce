import type { Request, Response, NextFunction } from "express";
import type { Logger } from "pino";

export const createRequestLogger = (baseLogger: Logger) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    const start = Date.now();

    response.on("finish", () => {
      const duration = Date.now() - start;
      const module = request.originalUrl.startsWith("/api/v1/admin")
        ? "admin"
        : request.originalUrl.startsWith("/api/v1/auth")
          ? "auth"
          : request.originalUrl.startsWith("/api/v1")
            ? "api"
            : "system";

      const logPayload = {
        method: request.method,
        url: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: duration,
        module,
        userId: request.context?.userId,
        sessionId: request.context?.sessionId,
        traceId: request.context?.traceId
      };

      if (response.statusCode >= 500) {
        baseLogger.error(logPayload, "request_completed");
      } else if (response.statusCode >= 400) {
        baseLogger.warn(logPayload, "request_completed");
      } else {
        baseLogger.info(logPayload, "request_completed");
      }
    });

    next();
  };
};

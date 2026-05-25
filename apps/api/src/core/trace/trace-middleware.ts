import type { NextFunction, Request, Response } from "express";
import type { Logger } from "pino";

import type { ITraceProvider } from "@/core/trace/trace-provider.js";

export const createTraceMiddleware =
  (traceProvider: ITraceProvider, baseLogger: Logger) =>
  (request: Request, response: Response, next: NextFunction): void => {
    const traceId = traceProvider.generateTraceId();
    const requestId = traceProvider.generateTraceId();

    traceProvider.runWithTrace({ traceId, requestId }, () => {
      request.context = {
        traceId,
        requestId
      };
      request.log = baseLogger.child({
        traceId,
        requestId,
        module: "http"
      });

      response.setHeader("x-trace-id", traceId);
      next();
    });
  };

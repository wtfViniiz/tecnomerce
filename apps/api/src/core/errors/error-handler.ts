import type { NextFunction, Request, Response } from "express";

import { env } from "@/config/env.js";
import { errorResponse } from "@/core/api/api-envelope.js";
import { BaseAppError } from "@/core/errors/base-app-error.js";
import { InternalServerError } from "@/core/errors/internal-server-error.js";

export const errorHandler = (
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction
): void => {
  const traceId = request.context.traceId;
  const appError = error instanceof BaseAppError ? error : new InternalServerError();

  request.log.error(
    {
      traceId,
      code: appError.code,
      details: appError.details,
      err:
        env.NODE_ENV === "production"
          ? undefined
          : error instanceof Error
            ? { message: error.message, stack: error.stack }
            : undefined
    },
    "request_failed"
  );

  response.status(appError.statusCode).json(
    errorResponse(
      traceId,
      appError.code,
      appError.message,
      appError.exposeDetails ? appError.details : undefined
    )
  );
};

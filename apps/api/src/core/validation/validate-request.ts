import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

import { ValidationError } from "@/core/errors/validation-error.js";

type ValidationSchemas = {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
  headers?: ZodSchema;
};

export const validateRequest =
  (schemas: ValidationSchemas) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        request.body = schemas.body.parse(request.body);
      }

      if (schemas.params) {
        request.params = schemas.params.parse(request.params);
      }

      if (schemas.query) {
        request.query = schemas.query.parse(request.query);
      }

      if (schemas.headers) {
        schemas.headers.parse(request.headers);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.flatten();
        next(new ValidationError("VALIDATION.REQUEST_INVALID", "Invalid request payload.", details));
        return;
      }

      next(error);
    }
  };

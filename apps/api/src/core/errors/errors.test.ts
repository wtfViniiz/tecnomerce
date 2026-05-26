import { describe, expect, it } from "vitest";

import { BaseAppError } from "@/core/errors/base-app-error.js";
import { AuthError } from "@/core/errors/auth-error.js";
import { ValidationError } from "@/core/errors/validation-error.js";
import { RbacError } from "@/core/errors/rbac-error.js";
import { RateLimitError } from "@/core/errors/rate-limit-error.js";
import { InternalServerError } from "@/core/errors/internal-server-error.js";
import { RequestError } from "@/core/errors/request-error.js";
import { ResourceError } from "@/core/errors/resource-error.js";

describe("Error hierarchy", () => {
  it("AuthError extends BaseAppError", () => {
    const error = new AuthError("AUTH.INVALID_CREDENTIALS", "Invalid credentials.");
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error).toBeInstanceOf(AuthError);
    expect(error.code).toBe("AUTH.INVALID_CREDENTIALS");
    expect(error.statusCode).toBe(401);
  });

  it("ValidationError extends BaseAppError with 400", () => {
    const error = new ValidationError("VALIDATION.REQUEST_INVALID", "Bad input.");
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.statusCode).toBe(400);
  });

  it("RbacError extends BaseAppError with 403", () => {
    const error = new RbacError("RBAC.FORBIDDEN", "No access.");
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.statusCode).toBe(403);
  });

  it("RateLimitError extends BaseAppError with 429", () => {
    const error = new RateLimitError("LOGIN", "Too many requests.");
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.statusCode).toBe(429);
  });

  it("InternalServerError extends BaseAppError with 500", () => {
    const error = new InternalServerError("Something broke.");
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.statusCode).toBe(500);
  });

  it("RequestError extends BaseAppError with 400", () => {
    const error = new RequestError("REQUEST.INVALID", "Bad request.");
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.statusCode).toBe(400);
  });

  it("ResourceError extends BaseAppError with 404", () => {
    const error = new ResourceError("RESOURCE.NOT_FOUND", "Not found.");
    expect(error).toBeInstanceOf(BaseAppError);
    expect(error.statusCode).toBe(404);
  });

  it("errors carry details when provided", () => {
    const details = { field: "email", reason: "required" };
    const error = new ValidationError("VALIDATION.REQUEST_INVALID", "Bad.", details);
    expect(error.details).toEqual(details);
  });

  it("exposes code and message properties", () => {
    const error = new AuthError("AUTH.INVALID_CREDENTIALS", "Invalid.");
    expect(error.code).toBe("AUTH.INVALID_CREDENTIALS");
    expect(error.message).toBe("Invalid.");
  });

  it("InternalServerError has default message when none provided", () => {
    const error = new InternalServerError();
    expect(error.code).toBe("SERVER.INTERNAL_ERROR");
    expect(error.message).toBe("Unexpected internal server error.");
    expect(error.statusCode).toBe(500);
  });
});

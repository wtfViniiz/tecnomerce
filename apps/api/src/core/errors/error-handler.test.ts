import { describe, expect, it, vi } from "vitest";

import { errorHandler } from "@/core/errors/error-handler.js";
import { AuthError } from "@/core/errors/auth-error.js";
import { ValidationError } from "@/core/errors/validation-error.js";
import { InternalServerError } from "@/core/errors/internal-server-error.js";

const createMockReqRes = (traceId = "trace-123") => {
  let statusCode = 0;
  let jsonPayload: unknown;

  const req = {
    context: { traceId },
    method: "GET",
    url: "/test",
    log: {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn()
    }
  } as never;

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (payload: unknown) => {
      jsonPayload = payload;
    }
  } as never;

  return { req, res, getStatusCode: () => statusCode, getJson: () => jsonPayload };
};

describe("errorHandler", () => {
  it("handles AuthError correctly", () => {
    const { req, res, getStatusCode, getJson } = createMockReqRes();
    const error = new AuthError("AUTH.INVALID_CREDENTIALS", "Invalid credentials.");

    errorHandler(error, req, res, () => {});

    expect(getStatusCode()).toBe(401);
    expect(getJson()).toEqual({
      status: "error",
      data: null,
      error: {
        code: "AUTH.INVALID_CREDENTIALS",
        message: "Invalid credentials."
      },
      traceId: "trace-123"
    });
  });

  it("handles ValidationError with details", () => {
    const { req, res, getStatusCode, getJson } = createMockReqRes();
    const details = { fieldErrors: { email: ["Required"] } };
    const error = new ValidationError("VALIDATION.REQUEST_INVALID", "Invalid.", details);

    errorHandler(error, req, res, () => {});

    expect(getStatusCode()).toBe(400);
    const json = getJson() as { error: { details: unknown } };
    expect(json.error.details).toEqual(details);
  });

  it("wraps unknown errors as InternalServerError", () => {
    const { req, res, getStatusCode, getJson } = createMockReqRes();
    const error = new Error("something unexpected");

    errorHandler(error, req, res, () => {});

    expect(getStatusCode()).toBe(500);
    expect((getJson() as { error: { code: string } }).error.code).toBe("SERVER.INTERNAL_ERROR");
    expect((getJson() as { traceId: string }).traceId).toBe("trace-123");
  });

  it("always includes traceId in response", () => {
    const { req, res, getJson } = createMockReqRes("custom-trace-456");
    const error = new InternalServerError("Boom.");

    errorHandler(error, req, res, () => {});

    expect((getJson() as { traceId: string }).traceId).toBe("custom-trace-456");
  });
});

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { validateRequest } from "@/core/validation/validate-request.js";
import { ValidationError } from "@/core/errors/validation-error.js";
import type { Request, Response } from "express";

const createMockReqRes = (overrides?: Partial<Request>) => {
  const req = { body: {}, params: {}, query: {}, headers: {}, ...overrides } as unknown as Request;
  const res = {} as Response;
  return { req, res };
};

describe("validateRequest", () => {
  it("passes valid body through and reassigns parsed value", () => {
    const schema = z.object({ email: z.string().email() });
    const { req, res } = createMockReqRes({ body: { email: "test@example.com" } });
    const next = vi.fn();

    validateRequest({ body: schema })(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body.email).toBe("test@example.com");
  });

  it("calls next with ValidationError on invalid body", () => {
    const schema = z.object({ email: z.string().email() });
    const { req, res } = createMockReqRes({ body: { email: "not-an-email" } });
    const next = vi.fn();

    validateRequest({ body: schema })(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const error = next.mock.calls[0]![0] as ValidationError;
    expect(error.code).toBe("VALIDATION.REQUEST_INVALID");
    expect(error.statusCode).toBe(400);
  });

  it("validates params independently", () => {
    const schema = z.object({ id: z.string().cuid() });
    const { req, res } = createMockReqRes({ params: { id: "abc123" } } as unknown as Partial<Request>);
    const next = vi.fn();

    validateRequest({ params: schema })(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
  });

  it("skips validation when no schema is provided for a segment", () => {
    const { req, res } = createMockReqRes();
    const next = vi.fn();

    validateRequest({})(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});

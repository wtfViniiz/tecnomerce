import { describe, expect, it, vi } from "vitest";

import { requirePermission } from "@/modules/auth/middleware/require-permission.middleware.js";
import { RbacError } from "@/core/errors/rbac-error.js";

describe("requirePermission middleware", () => {
  const buildReqResNext = (permissions: string[]) => {
    const nextFn = vi.fn();
    const req = {
      context: { permissions }
    } as never;
    const res = {} as never;
    return { req, res, next: nextFn };
  };

  it("calls next() when user has the required permission", () => {
    const { req, res, next } = buildReqResNext(["product:read", "product:write"]);
    const middleware = requirePermission("product:read");

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it("calls next with RbacError when user lacks the permission", () => {
    const { req, res, next } = buildReqResNext(["product:read"]);
    const middleware = requirePermission("product:delete");

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    const error = next.mock.calls[0]![0] as RbacError;
    expect(error).toBeInstanceOf(RbacError);
    expect(error.code).toBe("RBAC.PERMISSION_DENIED");
    expect(error.statusCode).toBe(403);
  });

  it("calls next with RbacError when permissions array is empty", () => {
    const { req, res, next } = buildReqResNext([]);
    const middleware = requirePermission("admin:access");

    middleware(req, res, next);

    const error = next.mock.calls[0]![0] as RbacError;
    expect(error).toBeInstanceOf(RbacError);
  });

  it("calls next with RbacError when permissions is undefined", () => {
    const nextFn = vi.fn();
    const req = { context: {} } as never;
    const res = {} as never;
    const middleware = requirePermission("product:read");

    middleware(req, res, nextFn);

    const error = nextFn.mock.calls[0]![0] as RbacError;
    expect(error).toBeInstanceOf(RbacError);
  });
});

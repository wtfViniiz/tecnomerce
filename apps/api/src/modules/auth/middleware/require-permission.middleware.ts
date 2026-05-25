import type { NextFunction, Request, Response } from "express";

import { RbacError } from "@/core/errors/rbac-error.js";

export const requirePermission =
  (permission: string) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    const permissions = request.context.permissions ?? [];
    if (!permissions.includes(permission)) {
      next(new RbacError("RBAC.PERMISSION_DENIED", "Permission denied."));
      return;
    }

    next();
  };

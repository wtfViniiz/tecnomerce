import { Router } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import { requirePermission } from "@/modules/auth/middleware/require-permission.middleware.js";
import {
  calculateShippingSchema,
  shippingMethodIdParamSchema
} from "@/modules/shipping/schemas/shipping.schema.js";
import type { ShippingController } from "@/modules/shipping/controllers/shipping.controller.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreateShippingRouterDeps = {
  controller: ShippingController;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createShippingRouters = (deps: CreateShippingRouterDeps): { adminRouter: Router; publicRouter: Router } => {
  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  // ── Admin router (authenticated) ──────────────────────────────

  const adminRouter = Router();

  adminRouter.get(
    "/admin/shipping/methods",
    authenticate,
    requirePermission("shipping:read"),
    asyncHandler(deps.controller.listMethods)
  );

  adminRouter.get(
    "/admin/shipping/methods/:id/rules",
    authenticate,
    requirePermission("shipping:read"),
    validateRequest({ params: shippingMethodIdParamSchema }),
    asyncHandler(deps.controller.listRules)
  );

  // ── Public router (authenticated user) ────────────────────────

  const publicRouter = Router();

  publicRouter.post(
    "/shipping/calculate",
    authenticate,
    validateRequest({ body: calculateShippingSchema }),
    asyncHandler(deps.controller.calculate)
  );

  return { adminRouter, publicRouter };
};

import { Router } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import { requirePermission } from "@/modules/auth/middleware/require-permission.middleware.js";
import {
  createCouponSchema,
  updateCouponSchema,
  couponIdParamSchema,
  validateCouponBodySchema
} from "@/modules/coupons/schemas/coupon.schema.js";
import type { CouponController } from "@/modules/coupons/controllers/coupon.controller.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreateCouponRouterDeps = {
  controller: CouponController;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createCouponRouters = (deps: CreateCouponRouterDeps): { adminRouter: Router; publicRouter: Router } => {
  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  // ── Admin router (authenticated) ──────────────────────────────

  const adminRouter = Router();

  adminRouter.get(
    "/admin/coupons",
    authenticate,
    requirePermission("coupon:read"),
    asyncHandler(deps.controller.list)
  );

  adminRouter.get(
    "/admin/coupons/:id",
    authenticate,
    requirePermission("coupon:read"),
    validateRequest({ params: couponIdParamSchema }),
    asyncHandler(deps.controller.getById)
  );

  adminRouter.post(
    "/admin/coupons",
    authenticate,
    requirePermission("coupon:create"),
    validateRequest({ body: createCouponSchema }),
    asyncHandler(deps.controller.create)
  );

  adminRouter.patch(
    "/admin/coupons/:id",
    authenticate,
    requirePermission("coupon:update"),
    validateRequest({ params: couponIdParamSchema, body: updateCouponSchema }),
    asyncHandler(deps.controller.update)
  );

  adminRouter.delete(
    "/admin/coupons/:id",
    authenticate,
    requirePermission("coupon:delete"),
    validateRequest({ params: couponIdParamSchema }),
    asyncHandler(deps.controller.softDelete)
  );

  // ── Public router (authenticated user) ────────────────────────

  const publicRouter = Router();

  publicRouter.post(
    "/coupons/validate",
    authenticate,
    validateRequest({ body: validateCouponBodySchema }),
    asyncHandler(deps.controller.validate)
  );

  return { adminRouter, publicRouter };
};

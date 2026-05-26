import { Router } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import { requirePermission } from "@/modules/auth/middleware/require-permission.middleware.js";
import {
  orderIdParamSchema,
  listOrdersQuerySchema
} from "@/modules/orders/schemas/order.schema.js";
import type { OrderController } from "@/modules/orders/controllers/order.controller.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreateOrderRouterDeps = {
  controller: OrderController;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createOrderRouters = (deps: CreateOrderRouterDeps): { adminRouter: Router; publicRouter: Router } => {
  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  // ── Admin router ─────────────────────────────────────

  const adminRouter = Router();

  adminRouter.get(
    "/admin/orders",
    authenticate,
    requirePermission("order:read"),
    validateRequest({ query: listOrdersQuerySchema }),
    asyncHandler(deps.controller.listAdmin)
  );

  adminRouter.get(
    "/admin/orders/:id",
    authenticate,
    requirePermission("order:read"),
    validateRequest({ params: orderIdParamSchema }),
    asyncHandler(deps.controller.getById)
  );

  // ── Public router (authenticated customer) ───────────

  const publicRouter = Router();

  publicRouter.get(
    "/orders",
    authenticate,
    asyncHandler(deps.controller.list)
  );

  publicRouter.get(
    "/orders/:id",
    authenticate,
    validateRequest({ params: orderIdParamSchema }),
    asyncHandler(deps.controller.getById)
  );

  publicRouter.post(
    "/orders/:id/cancel",
    authenticate,
    validateRequest({ params: orderIdParamSchema }),
    asyncHandler(deps.controller.cancel)
  );

  return { adminRouter, publicRouter };
};

import { Router } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import { requirePermission } from "@/modules/auth/middleware/require-permission.middleware.js";
import { checkoutSchema } from "@/modules/checkout/schemas/checkout.schema.js";
import type { CheckoutController } from "@/modules/checkout/controllers/checkout.controller.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreateCheckoutRouterDeps = {
  controller: CheckoutController;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createCheckoutRouters = (deps: CreateCheckoutRouterDeps): { adminRouter: Router; publicRouter: Router } => {
  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  // ── Public router ──────────────────────────────────

  const publicRouter = Router();

  publicRouter.post(
    "/checkout",
    authenticate,
    validateRequest({ body: checkoutSchema }),
    asyncHandler(deps.controller.checkout)
  );

  // ── Admin router (empty for now) ──────────────────

  const adminRouter = Router();

  return { adminRouter, publicRouter };
};

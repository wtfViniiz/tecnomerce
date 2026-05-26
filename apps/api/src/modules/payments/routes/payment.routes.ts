import express, { Router } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import { requirePermission } from "@/modules/auth/middleware/require-permission.middleware.js";
import {
  createPaymentSchema,
  paymentIdParamSchema
} from "@/modules/payments/schemas/payment.schema.js";
import type { PaymentController } from "@/modules/payments/controllers/payment.controller.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreatePaymentRouterDeps = {
  controller: PaymentController;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createPaymentRouters = (deps: CreatePaymentRouterDeps): { adminRouter: Router; publicRouter: Router; webhookRouter: Router } => {
  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  // ── Admin router ─────────────────────────────────────

  const adminRouter = Router();

  adminRouter.get(
    "/admin/payments/:id",
    authenticate,
    requirePermission("payment:read"),
    validateRequest({ params: paymentIdParamSchema }),
    asyncHandler(deps.controller.getById)
  );

  adminRouter.get(
    "/admin/payments/order/:orderId",
    authenticate,
    requirePermission("payment:read"),
    asyncHandler(deps.controller.getByOrderId)
  );

  // ── Public router (authenticated customer) ───────────

  const publicRouter = Router();

  publicRouter.post(
    "/payments",
    authenticate,
    validateRequest({ body: createPaymentSchema }),
    asyncHandler(deps.controller.create)
  );

  publicRouter.get(
    "/payments/order/:orderId",
    authenticate,
    asyncHandler(deps.controller.getByOrderId)
  );

  // ── Webhook router (no auth, raw body for signature validation) ─────

  const webhookRouter = Router();

  webhookRouter.post(
    "/webhooks/mercadopago",
    asyncHandler(deps.controller.webhook)
  );

  return { adminRouter, publicRouter, webhookRouter };
};

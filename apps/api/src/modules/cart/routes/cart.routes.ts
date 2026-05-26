import { Router } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import { createOptionalAuthenticateMiddleware } from "@/modules/cart/middleware/optional-authenticate.middleware.js";
import {
  addItemSchema,
  updateItemQuantitySchema,
  cartItemIdParamSchema,
  cartIdParamSchema,
  mergeGuestCartSchema
} from "@/modules/cart/schemas/cart.schema.js";
import type { CartController } from "@/modules/cart/controllers/cart.controller.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreateCartRouterDeps = {
  controller: CartController;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createCartRouters = (deps: CreateCartRouterDeps): { adminRouter: Router; publicRouter: Router } => {
  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  const optionalAuthenticate = createOptionalAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  // ── Public router ──────────────────────────────────

  const publicRouter = Router();

  publicRouter.get(
    "/cart",
    optionalAuthenticate,
    asyncHandler(deps.controller.getActive)
  );

  publicRouter.post(
    "/cart/items",
    optionalAuthenticate,
    validateRequest({ body: addItemSchema }),
    asyncHandler(deps.controller.addItem)
  );

  publicRouter.patch(
    "/cart/items/:itemId",
    optionalAuthenticate,
    validateRequest({ params: cartItemIdParamSchema, body: updateItemQuantitySchema }),
    asyncHandler(deps.controller.updateItemQuantity)
  );

  publicRouter.delete(
    "/cart/items/:itemId",
    optionalAuthenticate,
    validateRequest({ params: cartItemIdParamSchema }),
    asyncHandler(deps.controller.removeItem)
  );

  publicRouter.delete(
    "/cart/:cartId/clear",
    optionalAuthenticate,
    validateRequest({ params: cartIdParamSchema }),
    asyncHandler(deps.controller.clearCart)
  );

  publicRouter.post(
    "/cart/merge",
    authenticate,
    validateRequest({ body: mergeGuestCartSchema }),
    asyncHandler(deps.controller.mergeGuestCart)
  );

  publicRouter.get(
    "/cart/guest-token",
    asyncHandler(deps.controller.generateGuestToken)
  );

  // ── Admin router (empty for now) ────────────────────

  const adminRouter = Router();

  return { adminRouter, publicRouter };
};

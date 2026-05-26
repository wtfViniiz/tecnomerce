import { Router } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import { requirePermission } from "@/modules/auth/middleware/require-permission.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
  productSlugParamSchema,
  productIdParamSchema
} from "@/modules/catalog/products/schemas/product.schema.js";
import type { ProductController } from "@/modules/catalog/products/controllers/product.controller.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreateProductRouterDeps = {
  controller: ProductController;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createProductRouters = (deps: CreateProductRouterDeps): { adminRouter: Router; publicRouter: Router } => {
  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  // ── Admin router (authenticated) ──────────────────────────────

  const adminRouter = Router();

  adminRouter.get(
    "/admin/products",
    authenticate,
    requirePermission("product:create"),
    validateRequest({ query: productListQuerySchema }),
    asyncHandler(deps.controller.list)
  );

  adminRouter.post(
    "/admin/products",
    authenticate,
    requirePermission("product:create"),
    validateRequest({ body: createProductSchema }),
    asyncHandler(deps.controller.create)
  );

  adminRouter.patch(
    "/admin/products/:id",
    authenticate,
    requirePermission("product:update"),
    validateRequest({ params: productIdParamSchema, body: updateProductSchema }),
    asyncHandler(deps.controller.update)
  );

  adminRouter.post(
    "/admin/products/:id/publish",
    authenticate,
    requirePermission("product:update"),
    validateRequest({ params: productIdParamSchema }),
    asyncHandler(deps.controller.publish)
  );

  adminRouter.post(
    "/admin/products/:id/archive",
    authenticate,
    requirePermission("product:update"),
    validateRequest({ params: productIdParamSchema }),
    asyncHandler(deps.controller.archive)
  );

  // ── Public router (no auth, cached) ───────────────────────────

  const publicRouter = Router();

  publicRouter.get(
    "/products",
    validateRequest({ query: productListQuerySchema }),
    asyncHandler(deps.controller.listPublished)
  );

  publicRouter.get(
    "/products/:slug",
    validateRequest({ params: productSlugParamSchema }),
    asyncHandler(deps.controller.getBySlug)
  );

  return { adminRouter, publicRouter };
};

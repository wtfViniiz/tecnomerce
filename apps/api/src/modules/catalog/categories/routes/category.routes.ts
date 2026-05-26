import { Router } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import { requirePermission } from "@/modules/auth/middleware/require-permission.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
  categorySlugParamSchema,
  categoryIdParamSchema
} from "@/modules/catalog/categories/schemas/category.schema.js";
import type { CategoryController } from "@/modules/catalog/categories/controllers/category.controller.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreateCategoryRouterDeps = {
  controller: CategoryController;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createCategoryRouters = (deps: CreateCategoryRouterDeps): { adminRouter: Router; publicRouter: Router } => {
  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  // ── Admin router (authenticated) ──────────────────────────────

  const adminRouter = Router();

  adminRouter.get(
    "/admin/categories",
    authenticate,
    requirePermission("product:create"),
    asyncHandler(deps.controller.listAll)
  );

  adminRouter.post(
    "/admin/categories",
    authenticate,
    requirePermission("product:create"),
    validateRequest({ body: createCategorySchema }),
    asyncHandler(deps.controller.create)
  );

  adminRouter.patch(
    "/admin/categories/:id",
    authenticate,
    requirePermission("product:update"),
    validateRequest({ params: categoryIdParamSchema, body: updateCategorySchema }),
    asyncHandler(deps.controller.update)
  );

  adminRouter.delete(
    "/admin/categories/:id",
    authenticate,
    requirePermission("product:delete"),
    validateRequest({ params: categoryIdParamSchema }),
    asyncHandler(deps.controller.softDelete)
  );

  // ── Public router (no auth, cached) ───────────────────────────

  const publicRouter = Router();

  publicRouter.get(
    "/categories",
    asyncHandler(deps.controller.list)
  );

  publicRouter.get(
    "/categories/:slug",
    validateRequest({ params: categorySlugParamSchema }),
    asyncHandler(deps.controller.getBySlug)
  );

  return { adminRouter, publicRouter };
};

import { Router } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import { requirePermission } from "@/modules/auth/middleware/require-permission.middleware.js";
import {
  createBannerSchema,
  updateBannerSchema,
  bannerIdParamSchema
} from "@/modules/catalog/banners/schemas/banner.schema.js";
import type { BannerController } from "@/modules/catalog/banners/controllers/banner.controller.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreateBannerRouterDeps = {
  controller: BannerController;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createBannerRouters = (deps: CreateBannerRouterDeps): { adminRouter: Router; publicRouter: Router } => {
  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  // ── Admin router (authenticated) ──────────────────────────────

  const adminRouter = Router();

  adminRouter.get(
    "/admin/banners",
    authenticate,
    requirePermission("product:create"),
    asyncHandler(deps.controller.listAll)
  );

  adminRouter.get(
    "/admin/banners/:id",
    authenticate,
    requirePermission("product:create"),
    validateRequest({ params: bannerIdParamSchema }),
    asyncHandler(deps.controller.getById)
  );

  adminRouter.post(
    "/admin/banners",
    authenticate,
    requirePermission("product:create"),
    validateRequest({ body: createBannerSchema }),
    asyncHandler(deps.controller.create)
  );

  adminRouter.patch(
    "/admin/banners/:id",
    authenticate,
    requirePermission("product:update"),
    validateRequest({ params: bannerIdParamSchema, body: updateBannerSchema }),
    asyncHandler(deps.controller.update)
  );

  adminRouter.delete(
    "/admin/banners/:id",
    authenticate,
    requirePermission("product:delete"),
    validateRequest({ params: bannerIdParamSchema }),
    asyncHandler(deps.controller.softDelete)
  );

  // ── Public router (no auth, cached) ───────────────────────────

  const publicRouter = Router();

  publicRouter.get(
    "/banners",
    asyncHandler(deps.controller.listActive)
  );

  return { adminRouter, publicRouter };
};

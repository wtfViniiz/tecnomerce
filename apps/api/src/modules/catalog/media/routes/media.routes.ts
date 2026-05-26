import { Router } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import { requirePermission } from "@/modules/auth/middleware/require-permission.middleware.js";
import {
  registerMediaSchema,
  reorderMediaSchema,
  presignMediaSchema,
  productIdParamSchema,
  mediaIdParamSchema
} from "@/modules/catalog/media/schemas/media.schema.js";
import type { MediaController } from "@/modules/catalog/media/controllers/media.controller.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreateMediaRouterDeps = {
  controller: MediaController;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createMediaRouter = (deps: CreateMediaRouterDeps): Router => {
  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  const router = Router();

  router.post(
    "/admin/products/:productId/media",
    authenticate,
    requirePermission("product:update"),
    validateRequest({ params: productIdParamSchema, body: registerMediaSchema }),
    asyncHandler(deps.controller.register)
  );

  router.post(
    "/admin/products/:productId/media/presign",
    authenticate,
    requirePermission("product:update"),
    validateRequest({ params: productIdParamSchema, body: presignMediaSchema }),
    asyncHandler(deps.controller.presignUpload)
  );

  router.patch(
    "/admin/products/:productId/media/reorder",
    authenticate,
    requirePermission("product:update"),
    validateRequest({ params: productIdParamSchema, body: reorderMediaSchema }),
    asyncHandler(deps.controller.reorder)
  );

  router.delete(
    "/admin/products/:productId/media/:mediaId",
    authenticate,
    requirePermission("product:delete"),
    validateRequest({ params: mediaIdParamSchema }),
    asyncHandler(deps.controller.softDelete)
  );

  return router;
};

import { Router } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import {
  addFavoriteSchema,
  removeFavoriteParamSchema
} from "@/modules/favorites/schemas/favorite.schema.js";
import type { FavoriteController } from "@/modules/favorites/controllers/favorite.controller.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreateFavoriteRouterDeps = {
  controller: FavoriteController;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createFavoriteRouters = (deps: CreateFavoriteRouterDeps): { publicRouter: Router } => {
  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  // ── Public router (authenticated user) ─────────────────────

  const publicRouter = Router();

  publicRouter.get(
    "/favorites",
    authenticate,
    asyncHandler(deps.controller.list)
  );

  publicRouter.post(
    "/favorites",
    authenticate,
    validateRequest({ body: addFavoriteSchema }),
    asyncHandler(deps.controller.add)
  );

  publicRouter.post(
    "/favorites/toggle",
    authenticate,
    validateRequest({ body: addFavoriteSchema }),
    asyncHandler(deps.controller.toggle)
  );

  publicRouter.delete(
    "/favorites/:productId",
    authenticate,
    validateRequest({ params: removeFavoriteParamSchema }),
    asyncHandler(deps.controller.remove)
  );

  return { publicRouter };
};

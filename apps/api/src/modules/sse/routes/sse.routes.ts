import { Router } from "express";
import type { Response } from "express";

import { asyncHandler } from "@/core/http/async-handler.js";
import { createRateLimitMiddleware } from "@/core/rate-limit/rate-limit.middleware.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import { requirePermission } from "@/modules/auth/middleware/require-permission.middleware.js";
import type { ISseProvider, IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

type CreateSseRouterDeps = {
  sseProvider: ISseProvider;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createSseRouter = (deps: CreateSseRouterDeps): Router => {
  const router = Router();

  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );

  const adminRateLimit = createRateLimitMiddleware({
    key: (request) => request.context?.userId ?? request.ip ?? "unknown",
    limit: 60,
    windowSeconds: 60,
    code: "RATE_LIMIT.ADMIN_API"
  });

  router.get(
    "/admin/events",
    authenticate,
    requirePermission("admin:access"),
    adminRateLimit,
    asyncHandler(async (request, response: Response) => {
      const userId = request.context.userId;
      const sessionId = request.context.sessionId;

      if (!userId || !sessionId) {
        response.status(401).end();
        return;
      }

      await deps.sseProvider.connect(
        {
          connectionId: "",
          scope: "ADMIN",
          userId,
          sessionId
        },
        response
      );
    })
  );

  router.get(
    "/user/events",
    authenticate,
    asyncHandler(async (request, response: Response) => {
      const userId = request.context.userId;
      const sessionId = request.context.sessionId;

      if (!userId || !sessionId) {
        response.status(401).end();
        return;
      }

      await deps.sseProvider.connect(
        {
          connectionId: "",
          scope: "USER",
          userId,
          sessionId
        },
        response
      );
    })
  );

  return router;
};

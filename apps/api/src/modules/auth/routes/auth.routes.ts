import { Router } from "express";

import { AuthError } from "@/core/errors/auth-error.js";
import { asyncHandler } from "@/core/http/async-handler.js";
import { buildSecureRefreshContext, createRateLimitMiddleware } from "@/core/rate-limit/rate-limit.middleware.js";
import { validateRequest } from "@/core/validation/validate-request.js";
import { createAdmin2faRequiredMiddleware } from "@/modules/auth/middleware/admin-2fa-required.middleware.js";
import { createAuthenticateMiddleware } from "@/modules/auth/middleware/authenticate.middleware.js";
import { requirePermission } from "@/modules/auth/middleware/require-permission.middleware.js";
import { emptySchema } from "@/modules/auth/schemas/me.schema.js";
import { loginSchema } from "@/modules/auth/schemas/login.schema.js";
import { registerSchema } from "@/modules/auth/schemas/register.schema.js";
import { refreshSchema } from "@/modules/auth/schemas/refresh.schema.js";
import { revokeSessionBodySchema, sessionIdParamSchema } from "@/modules/auth/schemas/session.schema.js";
import { disableTwoFaSchema, verifyTwoFaSchema } from "@/modules/auth/schemas/two-fa.schema.js";
import type { AuthController } from "@/modules/auth/controllers/auth.controller.js";
import type { AuthService } from "@/modules/auth/services/auth.service.js";
import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";
import { authConfig } from "@/config/auth.js";

type CreateAuthRouterDeps = {
  controller: AuthController;
  authService: AuthService;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createAuthRouter = (deps: CreateAuthRouterDeps): Router => {
  const router = Router();

  const authenticate = createAuthenticateMiddleware(
    deps.tokenProvider,
    deps.userProvider,
    deps.sessionProvider,
    deps.rbacProvider
  );
  const admin2faRequired = createAdmin2faRequiredMiddleware(
    deps.authService,
    deps.userProvider,
    deps.sessionProvider
  );

  router.post(
    "/auth/register",
    createRateLimitMiddleware({
      key: (request) => request.ip ?? "unknown",
      limit: 3,
      windowSeconds: 60,
      code: "RATE_LIMIT.AUTH_REGISTER"
    }),
    validateRequest({ body: registerSchema }),
    asyncHandler(deps.controller.register)
  );

  router.post(
    "/auth/login",
    createRateLimitMiddleware({
      key: (request) => `${request.ip}:${request.body.email ?? ""}`,
      limit: 5,
      windowSeconds: 60,
      code: "RATE_LIMIT.AUTH_LOGIN"
    }),
    validateRequest({ body: loginSchema }),
    asyncHandler(deps.controller.login)
  );

  router.post(
    "/auth/refresh",
    validateRequest({ body: refreshSchema }),
    asyncHandler(async (request, response) => {
        const rawRefreshToken = request.cookies[authConfig.refreshCookieName] as string | undefined;
        if (!rawRefreshToken) {
          throw new AuthError("AUTH.MISSING_REFRESH_TOKEN", "Missing refresh token.");
        }

      const lookupHash = await deps.tokenProvider.generateRefreshTokenLookupHash(rawRefreshToken);
      const session = await deps.sessionProvider.findSessionByRefreshLookupHash(lookupHash);
      const userId = session?.userId;
      const sessionId = session?.id;
      const userAgent = request.headers["user-agent"] ?? "";

      return createRateLimitMiddleware({
        key: () =>
          userId && sessionId
            ? buildSecureRefreshContext({
                userId,
                sessionId,
                ipAddress: request.ip ?? "0.0.0.0",
                userAgent
              })
            : null,
        limit: 10,
        windowSeconds: 60,
        code: "RATE_LIMIT.AUTH_REFRESH"
      })(request, response, async (error?: unknown) => {
        if (error) {
          throw error;
        }
        await deps.controller.refresh(request, response);
      });
    })
  );

  router.use(authenticate);

  router.post("/auth/logout", asyncHandler(deps.controller.logout));
  router.post("/auth/logout-all", asyncHandler(deps.controller.logoutAll));
  router.get("/auth/sessions", asyncHandler(deps.controller.listSessions));
  router.delete(
    "/auth/sessions/:sessionId",
    validateRequest({ params: sessionIdParamSchema, body: revokeSessionBodySchema }),
    asyncHandler(deps.controller.revokeSession)
  );

  router.post(
    "/auth/2fa/enroll",
    requirePermission("admin:access"),
    asyncHandler(deps.controller.enrollTwoFactor)
  );
  router.post(
    "/auth/2fa/verify",
    requirePermission("admin:access"),
    createRateLimitMiddleware({
      key: (request) => request.context.sessionId ?? null,
      limit: 10,
      windowSeconds: 60,
      code: "RATE_LIMIT.AUTH_TWO_FA_VERIFY"
    }),
    validateRequest({ body: verifyTwoFaSchema }),
    asyncHandler(deps.controller.verifyTwoFactor)
  );
  router.post(
    "/auth/2fa/disable",
    requirePermission("admin:access"),
    validateRequest({ body: disableTwoFaSchema }),
    asyncHandler(deps.controller.disableTwoFactor)
  );
  router.post(
    "/auth/2fa/step-up",
    requirePermission("admin:access"),
    createRateLimitMiddleware({
      key: (request) => request.context.sessionId ?? null,
      limit: 5,
      windowSeconds: 60,
      code: "RATE_LIMIT.AUTH_STEP_UP"
    }),
    validateRequest({ body: verifyTwoFaSchema }),
    asyncHandler(deps.controller.stepUp)
  );
  router.get("/auth/me", validateRequest({ query: emptySchema }), asyncHandler(deps.controller.me));

  router.get(
    "/auth/admin-sensitive-check",
    requirePermission("analytics:sensitive-read"),
    admin2faRequired,
    asyncHandler(async (request, response) => {
      response.json(
        {
          status: "success",
          data: { allowed: true },
          error: null,
          traceId: request.context.traceId
        }
      );
    })
  );

  return router;
};

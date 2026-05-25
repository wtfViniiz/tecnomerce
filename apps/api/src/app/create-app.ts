import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import helmet from "helmet";

import { errorHandler } from "@/core/errors/error-handler.js";
import { logger } from "@/core/logging/logger.js";
import { createTraceMiddleware } from "@/core/trace/trace-middleware.js";
import type { ITraceProvider } from "@/core/trace/trace-provider.js";
import { createAuthRouter } from "@/modules/auth/routes/auth.routes.js";
import type { AuthController } from "@/modules/auth/controllers/auth.controller.js";
import type { AuthService } from "@/modules/auth/services/auth.service.js";
import { createHealthRouter } from "@/modules/health/routes/health.routes.js";
import type { HealthController } from "@/modules/health/controllers/health.controller.js";
import type {
  IRbacProvider,
  ISessionProvider,
  ITokenProvider,
  IUserProvider
} from "@/providers/contracts.js";

export type CreateAppDeps = {
  traceProvider: ITraceProvider;
  healthController: HealthController;
  authController: AuthController;
  authService: AuthService;
  tokenProvider: ITokenProvider;
  userProvider: IUserProvider;
  sessionProvider: ISessionProvider;
  rbacProvider: IRbacProvider;
};

export const createApp = (deps: CreateAppDeps): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(createTraceMiddleware(deps.traceProvider, logger));

  app.use("/api/v1", createHealthRouter(deps.healthController));
  app.use(
    "/api/v1",
    createAuthRouter({
      controller: deps.authController,
      authService: deps.authService,
      tokenProvider: deps.tokenProvider,
      userProvider: deps.userProvider,
      sessionProvider: deps.sessionProvider,
      rbacProvider: deps.rbacProvider
    })
  );

  app.use(errorHandler);

  return app;
};

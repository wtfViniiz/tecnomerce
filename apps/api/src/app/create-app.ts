import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import helmet from "helmet";

import { errorHandler } from "@/core/errors/error-handler.js";
import { logger } from "@/core/logging/logger.js";
import { createRequestLogger } from "@/core/logging/request-logger.middleware.js";
import { createMetricsMiddleware } from "@/core/metrics/metrics.middleware.js";
import { register } from "@/core/metrics/metrics.js";
import { createTraceMiddleware } from "@/core/trace/trace-middleware.js";
import type { ITraceProvider } from "@/core/trace/trace-provider.js";
import { createAuthRouter } from "@/modules/auth/routes/auth.routes.js";
import type { AuthController } from "@/modules/auth/controllers/auth.controller.js";
import type { AuthService } from "@/modules/auth/services/auth.service.js";
import { createHealthRouter } from "@/modules/health/routes/health.routes.js";
import type { HealthController } from "@/modules/health/controllers/health.controller.js";
import { createSseRouter } from "@/modules/sse/routes/sse.routes.js";
import { createCategoryRouters } from "@/modules/catalog/categories/routes/category.routes.js";
import type { CategoryController } from "@/modules/catalog/categories/controllers/category.controller.js";
import type { CategoryService } from "@/modules/catalog/categories/services/category.service.js";
import { createProductRouters } from "@/modules/catalog/products/routes/product.routes.js";
import type { ProductController } from "@/modules/catalog/products/controllers/product.controller.js";
import type { ProductService } from "@/modules/catalog/products/services/product.service.js";
import { createBannerRouters } from "@/modules/catalog/banners/routes/banner.routes.js";
import type { BannerController } from "@/modules/catalog/banners/controllers/banner.controller.js";
import type { BannerService } from "@/modules/catalog/banners/services/banner.service.js";
import { createMediaRouter } from "@/modules/catalog/media/routes/media.routes.js";
import type { MediaController } from "@/modules/catalog/media/controllers/media.controller.js";
import type { MediaService } from "@/modules/catalog/media/services/media.service.js";
import type {
  IRbacProvider,
  ISessionProvider,
  ISseProvider,
  IStorageProvider,
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
  sseProvider: ISseProvider;
  // Phase 3
  categoryController: CategoryController;
  categoryService: CategoryService;
  productController: ProductController;
  productService: ProductService;
  bannerController: BannerController;
  bannerService: BannerService;
  mediaController: MediaController;
  mediaService: MediaService;
  storageProvider: IStorageProvider;
};

export const createApp = (deps: CreateAppDeps): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(createTraceMiddleware(deps.traceProvider, logger));
  app.use(createRequestLogger(logger));
  app.use(createMetricsMiddleware());

  // Prometheus metrics endpoint (no auth required)
  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  });

  // Core routes
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
  app.use(
    "/api/v1",
    createSseRouter({
      sseProvider: deps.sseProvider,
      tokenProvider: deps.tokenProvider,
      userProvider: deps.userProvider,
      sessionProvider: deps.sessionProvider,
      rbacProvider: deps.rbacProvider
    })
  );

  // Catalog routes
  const categoryRouters = createCategoryRouters({
    controller: deps.categoryController,
    tokenProvider: deps.tokenProvider,
    userProvider: deps.userProvider,
    sessionProvider: deps.sessionProvider,
    rbacProvider: deps.rbacProvider
  });
  app.use("/api/v1", categoryRouters.publicRouter);
  app.use("/api/v1", categoryRouters.adminRouter);

  const productRouters = createProductRouters({
    controller: deps.productController,
    tokenProvider: deps.tokenProvider,
    userProvider: deps.userProvider,
    sessionProvider: deps.sessionProvider,
    rbacProvider: deps.rbacProvider
  });
  app.use("/api/v1", productRouters.publicRouter);
  app.use("/api/v1", productRouters.adminRouter);

  const bannerRouters = createBannerRouters({
    controller: deps.bannerController,
    tokenProvider: deps.tokenProvider,
    userProvider: deps.userProvider,
    sessionProvider: deps.sessionProvider,
    rbacProvider: deps.rbacProvider
  });
  app.use("/api/v1", bannerRouters.publicRouter);
  app.use("/api/v1", bannerRouters.adminRouter);

  app.use(
    "/api/v1",
    createMediaRouter({
      controller: deps.mediaController,
      tokenProvider: deps.tokenProvider,
      userProvider: deps.userProvider,
      sessionProvider: deps.sessionProvider,
      rbacProvider: deps.rbacProvider
    })
  );

  app.use(errorHandler);

  return app;
};

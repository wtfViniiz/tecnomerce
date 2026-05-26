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
import { createFavoriteRouters } from "@/modules/favorites/routes/favorite.routes.js";
import type { FavoriteController } from "@/modules/favorites/controllers/favorite.controller.js";
import { createAddressRouters } from "@/modules/addresses/routes/address.routes.js";
import type { AddressController } from "@/modules/addresses/controllers/address.controller.js";
import { createCouponRouters } from "@/modules/coupons/routes/coupon.routes.js";
import type { CouponController } from "@/modules/coupons/controllers/coupon.controller.js";
import { createShippingRouters } from "@/modules/shipping/routes/shipping.routes.js";
import type { ShippingController } from "@/modules/shipping/controllers/shipping.controller.js";
import { createCartRouters } from "@/modules/cart/routes/cart.routes.js";
import type { CartController } from "@/modules/cart/controllers/cart.controller.js";
import { createOrderRouters } from "@/modules/orders/routes/order.routes.js";
import type { OrderController } from "@/modules/orders/controllers/order.controller.js";
import { createPaymentRouters } from "@/modules/payments/routes/payment.routes.js";
import type { PaymentController } from "@/modules/payments/controllers/payment.controller.js";
import { createCheckoutRouters } from "@/modules/checkout/routes/checkout.routes.js";
import type { CheckoutController } from "@/modules/checkout/controllers/checkout.controller.js";
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
  // Phase 4
  favoriteController: FavoriteController;
  addressController: AddressController;
  couponController: CouponController;
  shippingController: ShippingController;
  cartController: CartController;
  orderController: OrderController;
  paymentController: PaymentController;
  checkoutController: CheckoutController;
};

export const createApp = (deps: CreateAppDeps): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use("/api/v1/webhooks/mercadopago", express.raw({ type: "application/json" }));
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

  // Phase 4 routes
  const favoriteRouters = createFavoriteRouters({
    controller: deps.favoriteController,
    tokenProvider: deps.tokenProvider,
    userProvider: deps.userProvider,
    sessionProvider: deps.sessionProvider,
    rbacProvider: deps.rbacProvider
  });
  app.use("/api/v1", favoriteRouters.publicRouter);

  const addressRouters = createAddressRouters({
    controller: deps.addressController,
    tokenProvider: deps.tokenProvider,
    userProvider: deps.userProvider,
    sessionProvider: deps.sessionProvider,
    rbacProvider: deps.rbacProvider
  });
  app.use("/api/v1", addressRouters.publicRouter);

  const couponRouters = createCouponRouters({
    controller: deps.couponController,
    tokenProvider: deps.tokenProvider,
    userProvider: deps.userProvider,
    sessionProvider: deps.sessionProvider,
    rbacProvider: deps.rbacProvider
  });
  app.use("/api/v1", couponRouters.publicRouter);
  app.use("/api/v1", couponRouters.adminRouter);

  const shippingRouters = createShippingRouters({
    controller: deps.shippingController,
    tokenProvider: deps.tokenProvider,
    userProvider: deps.userProvider,
    sessionProvider: deps.sessionProvider,
    rbacProvider: deps.rbacProvider
  });
  app.use("/api/v1", shippingRouters.publicRouter);
  app.use("/api/v1", shippingRouters.adminRouter);

  const cartRouters = createCartRouters({
    controller: deps.cartController,
    tokenProvider: deps.tokenProvider,
    userProvider: deps.userProvider,
    sessionProvider: deps.sessionProvider,
    rbacProvider: deps.rbacProvider
  });
  app.use("/api/v1", cartRouters.publicRouter);

  const orderRouters = createOrderRouters({
    controller: deps.orderController,
    tokenProvider: deps.tokenProvider,
    userProvider: deps.userProvider,
    sessionProvider: deps.sessionProvider,
    rbacProvider: deps.rbacProvider
  });
  app.use("/api/v1", orderRouters.publicRouter);
  app.use("/api/v1", orderRouters.adminRouter);

  const paymentRouters = createPaymentRouters({
    controller: deps.paymentController,
    tokenProvider: deps.tokenProvider,
    userProvider: deps.userProvider,
    sessionProvider: deps.sessionProvider,
    rbacProvider: deps.rbacProvider
  });
  app.use("/api/v1", paymentRouters.publicRouter);
  app.use("/api/v1", paymentRouters.adminRouter);

  // Webhook route (separate - no auth, raw body)
  app.use("/api/v1", paymentRouters.webhookRouter);

  const checkoutRouters = createCheckoutRouters({
    controller: deps.checkoutController,
    tokenProvider: deps.tokenProvider,
    userProvider: deps.userProvider,
    sessionProvider: deps.sessionProvider,
    rbacProvider: deps.rbacProvider
  });
  app.use("/api/v1", checkoutRouters.publicRouter);

  app.use(errorHandler);

  return app;
};

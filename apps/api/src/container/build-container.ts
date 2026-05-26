import { Container } from "@/container/container.js";
import { AsyncLocalTraceProvider } from "@/core/trace/trace-provider.js";
import { AuthController, AuthService } from "@/modules/auth/index.js";
import { HealthController } from "@/modules/health/controllers/health.controller.js";
import { CategoryController } from "@/modules/catalog/categories/controllers/category.controller.js";
import { CategoryService } from "@/modules/catalog/categories/services/category.service.js";
import { ProductController } from "@/modules/catalog/products/controllers/product.controller.js";
import { ProductService } from "@/modules/catalog/products/services/product.service.js";
import { BannerController } from "@/modules/catalog/banners/controllers/banner.controller.js";
import { BannerService } from "@/modules/catalog/banners/services/banner.service.js";
import { MediaController } from "@/modules/catalog/media/controllers/media.controller.js";
import { MediaService } from "@/modules/catalog/media/services/media.service.js";
import { FavoriteController } from "@/modules/favorites/controllers/favorite.controller.js";
import { FavoriteService } from "@/modules/favorites/services/favorite.service.js";
import { AddressController } from "@/modules/addresses/controllers/address.controller.js";
import { AddressService } from "@/modules/addresses/services/address.service.js";
import { CouponController } from "@/modules/coupons/controllers/coupon.controller.js";
import { CouponService } from "@/modules/coupons/services/coupon.service.js";
import { ShippingController } from "@/modules/shipping/controllers/shipping.controller.js";
import { ShippingService } from "@/modules/shipping/services/shipping.service.js";
import { CartController } from "@/modules/cart/controllers/cart.controller.js";
import { CartService } from "@/modules/cart/services/cart.service.js";
import { OrderController } from "@/modules/orders/controllers/order.controller.js";
import { OrderService } from "@/modules/orders/services/order.service.js";
import { PaymentController } from "@/modules/payments/controllers/payment.controller.js";
import { PaymentService } from "@/modules/payments/services/payment.service.js";
import { CheckoutController } from "@/modules/checkout/controllers/checkout.controller.js";
import { CheckoutService } from "@/modules/checkout/services/checkout.service.js";
import { PrismaFavoriteProvider } from "@/providers/favorite.provider.js";
import { PrismaAddressProvider } from "@/providers/address.provider.js";
import { PrismaCouponProvider, PrismaCouponUsageProvider, PrismaCouponRestrictionProvider } from "@/providers/coupon.provider.js";
import { PrismaShippingRuleProvider } from "@/providers/shipping-rule.provider.js";
import { PrismaCartProvider } from "@/providers/cart.provider.js";
import { PrismaOrderProvider } from "@/providers/order.provider.js";
import { PrismaPaymentAttemptProvider } from "@/providers/payment-attempt.provider.js";
import { PrismaPaymentWebhookEventProvider } from "@/providers/payment-webhook.provider.js";
import { PrismaAuditProvider } from "@/providers/audit.provider.js";
import { PrismaBannerProvider } from "@/providers/banner.provider.js";
import { PrismaCategoryProvider } from "@/providers/category.provider.js";
import { RedisPermissionCacheProvider } from "@/providers/permission-cache.provider.js";
import { PrismaProductProvider } from "@/providers/product.provider.js";
import { PrismaProductVariantProvider } from "@/providers/product-variant.provider.js";
import { PrismaProductMediaProvider } from "@/providers/product-media.provider.js";
import { RedisPublicCacheProvider } from "@/providers/public-cache.provider.js";
import { BullMqQueueProvider } from "@/providers/queue.js";
import { PrismaRbacProvider } from "@/providers/rbac.provider.js";
import { PrismaSessionProvider } from "@/providers/session.provider.js";
import { RedisPubSubSseProvider } from "@/providers/sse.provider.js";
import {
  StubEmailProvider,
  StubPaymentProvider,
  StubShippingProvider,
  StubStorageProvider
} from "@/providers/stub-external.providers.js";
import { JwtTokenProvider } from "@/providers/token.provider.js";
import { TOKENS } from "@/providers/tokens.js";
import { PrismaUserProvider } from "@/providers/user.provider.js";
import { checkDatabaseHealth, checkRedisHealth } from "@/providers/health.provider.js";
import { registerAllWorkers } from "@/queues/workers/index.js";
import { logger } from "@/core/logging/logger.js";

export const buildContainer = (): Container => {
  const container = new Container();

  // Phase 2 providers
  const traceProvider = new AsyncLocalTraceProvider();
  const permissionCacheProvider = new RedisPermissionCacheProvider();
  const auditProvider = new PrismaAuditProvider();
  const userProvider = new PrismaUserProvider();
  const sessionProvider = new PrismaSessionProvider();
  const tokenProvider = new JwtTokenProvider();
  const rbacProvider = new PrismaRbacProvider(permissionCacheProvider);
  const queueProvider = new BullMqQueueProvider();
  const sseProvider = new RedisPubSubSseProvider();
  const storageProvider = new StubStorageProvider();
  const emailProvider = new StubEmailProvider();
  const paymentProvider = new StubPaymentProvider();
  const shippingProvider = new StubShippingProvider();

  // Phase 2 services
  const authService = new AuthService(
    userProvider,
    sessionProvider,
    tokenProvider,
    rbacProvider,
    auditProvider
  );
  const authController = new AuthController(authService);
  const healthController = new HealthController({
    checkDatabase: checkDatabaseHealth,
    checkRedis: checkRedisHealth
  });

  // Phase 3 catalog providers
  const categoryProvider = new PrismaCategoryProvider();
  const productProvider = new PrismaProductProvider();
  const productVariantProvider = new PrismaProductVariantProvider();
  const productMediaProvider = new PrismaProductMediaProvider();
  const bannerProvider = new PrismaBannerProvider();
  const publicCacheProvider = new RedisPublicCacheProvider();

  // Phase 3 catalog services
  const categoryService = new CategoryService(
    categoryProvider,
    publicCacheProvider,
    auditProvider
  );
  const categoryController = new CategoryController(categoryService);
  const productService = new ProductService(
    productProvider,
    productVariantProvider,
    categoryProvider,
    publicCacheProvider,
    auditProvider
  );
  const productController = new ProductController(productService);
  const bannerService = new BannerService(
    bannerProvider,
    publicCacheProvider
  );
  const bannerController = new BannerController(bannerService);
  const mediaService = new MediaService(
    productMediaProvider,
    storageProvider
  );
  const mediaController = new MediaController(mediaService);

  // Phase 4 providers
  const favoriteProvider = new PrismaFavoriteProvider();
  const addressProvider = new PrismaAddressProvider();
  const couponProvider = new PrismaCouponProvider();
  const couponUsageProvider = new PrismaCouponUsageProvider();
  const couponRestrictionProvider = new PrismaCouponRestrictionProvider();
  const shippingRuleProvider = new PrismaShippingRuleProvider();
  const cartProvider = new PrismaCartProvider();
  const orderProvider = new PrismaOrderProvider();
  const paymentAttemptProvider = new PrismaPaymentAttemptProvider();
  const paymentWebhookEventProvider = new PrismaPaymentWebhookEventProvider();

  // Phase 4 services (order matters - dependencies first)
  const favoriteService = new FavoriteService(favoriteProvider, auditProvider);
  const favoriteController = new FavoriteController(favoriteService);

  const addressService = new AddressService(addressProvider, auditProvider);
  const addressController = new AddressController(addressService);

  const couponService = new CouponService(couponProvider, couponUsageProvider, couponRestrictionProvider, auditProvider);
  const couponController = new CouponController(couponService);

  const shippingService = new ShippingService(shippingRuleProvider, auditProvider);
  const shippingController = new ShippingController(shippingService);

  const cartService = new CartService(cartProvider, productVariantProvider, auditProvider);
  const cartController = new CartController(cartService);

  const orderService = new OrderService(orderProvider, auditProvider);
  const orderController = new OrderController(orderService);

  const paymentService = new PaymentService(
    orderProvider,
    paymentAttemptProvider,
    paymentWebhookEventProvider,
    auditProvider
  );
  const paymentController = new PaymentController(paymentService);

  const checkoutService = new CheckoutService(
    cartProvider,
    addressProvider,
    shippingRuleProvider,
    couponProvider,
    couponUsageProvider,
    couponRestrictionProvider,
    orderProvider,
    paymentAttemptProvider,
    productVariantProvider,
    productProvider,
    auditProvider
  );
  const checkoutController = new CheckoutController(checkoutService);

  registerAllWorkers({
    queueProvider,
    emailProvider,
    auditProvider,
    storageProvider,
    sseProvider
  });

  logger.info("Container built with all providers and workers");

  // Phase 2 registrations
  container.register(TOKENS.traceProvider, traceProvider);
  container.register(TOKENS.permissionCacheProvider, permissionCacheProvider);
  container.register(TOKENS.auditProvider, auditProvider);
  container.register(TOKENS.userProvider, userProvider);
  container.register(TOKENS.sessionProvider, sessionProvider);
  container.register(TOKENS.tokenProvider, tokenProvider);
  container.register(TOKENS.rbacProvider, rbacProvider);
  container.register(TOKENS.queueProvider, queueProvider);
  container.register(TOKENS.sseProvider, sseProvider);
  container.register(TOKENS.storageProvider, storageProvider);
  container.register(TOKENS.emailProvider, emailProvider);
  container.register(TOKENS.paymentProvider, paymentProvider);
  container.register(TOKENS.shippingProvider, shippingProvider);
  container.register(TOKENS.authService, authService);
  container.register(TOKENS.authController, authController);
  container.register(TOKENS.healthController, healthController);

  // Phase 3 registrations
  container.register(TOKENS.categoryProvider, categoryProvider);
  container.register(TOKENS.productProvider, productProvider);
  container.register(TOKENS.productVariantProvider, productVariantProvider);
  container.register(TOKENS.productMediaProvider, productMediaProvider);
  container.register(TOKENS.bannerProvider, bannerProvider);
  container.register(TOKENS.publicCacheProvider, publicCacheProvider);
  container.register(TOKENS.categoryService, categoryService);
  container.register(TOKENS.categoryController, categoryController);
  container.register(TOKENS.productService, productService);
  container.register(TOKENS.productController, productController);
  container.register(TOKENS.bannerService, bannerService);
  container.register(TOKENS.bannerController, bannerController);
  container.register(TOKENS.mediaService, mediaService);
  container.register(TOKENS.mediaController, mediaController);

  // Phase 4 registrations
  container.register(TOKENS.favoriteProvider, favoriteProvider);
  container.register(TOKENS.addressProvider, addressProvider);
  container.register(TOKENS.couponProvider, couponProvider);
  container.register(TOKENS.couponUsageProvider, couponUsageProvider);
  container.register(TOKENS.couponRestrictionProvider, couponRestrictionProvider);
  container.register(TOKENS.shippingRuleProvider, shippingRuleProvider);
  container.register(TOKENS.cartProvider, cartProvider);
  container.register(TOKENS.orderProvider, orderProvider);
  container.register(TOKENS.paymentAttemptProvider, paymentAttemptProvider);
  container.register(TOKENS.paymentWebhookEventProvider, paymentWebhookEventProvider);
  container.register(TOKENS.favoriteService, favoriteService);
  container.register(TOKENS.favoriteController, favoriteController);
  container.register(TOKENS.addressService, addressService);
  container.register(TOKENS.addressController, addressController);
  container.register(TOKENS.couponService, couponService);
  container.register(TOKENS.couponController, couponController);
  container.register(TOKENS.shippingService, shippingService);
  container.register(TOKENS.shippingController, shippingController);
  container.register(TOKENS.cartService, cartService);
  container.register(TOKENS.cartController, cartController);
  container.register(TOKENS.orderService, orderService);
  container.register(TOKENS.orderController, orderController);
  container.register(TOKENS.paymentService, paymentService);
  container.register(TOKENS.paymentController, paymentController);
  container.register(TOKENS.checkoutService, checkoutService);
  container.register(TOKENS.checkoutController, checkoutController);

  return container;
};

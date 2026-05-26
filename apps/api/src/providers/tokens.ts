import type {
  IAuditProvider,
  IBannerProvider,
  ICategoryProvider,
  IEmailProvider,
  IPaymentProvider,
  IPermissionCacheProvider,
  IProductMediaProvider,
  IProductProvider,
  IProductVariantProvider,
  IPublicCacheProvider,
  IQueueProvider,
  IRbacProvider,
  ISessionProvider,
  IShippingProvider,
  ISseProvider,
  IStorageProvider,
  ITokenProvider,
  ITraceProvider,
  IUserProvider
} from "@/providers/contracts.js";

import type {
  ICartProvider,
  ICouponProvider,
  ICouponUsageProvider,
  IAddressProvider,
  IShippingRuleProvider,
  IOrderProvider,
  IPaymentAttemptProvider,
  IPaymentWebhookEventProvider,
  IFavoriteProvider
} from "@/providers/contracts-fase4.js";

import type { ServiceToken } from "@/container/container.js";
import type { AuthController } from "@/modules/auth/controllers/auth.controller.js";
import type { AuthService } from "@/modules/auth/services/auth.service.js";
import type { HealthController } from "@/modules/health/controllers/health.controller.js";
import type { CategoryController } from "@/modules/catalog/categories/controllers/category.controller.js";
import type { CategoryService } from "@/modules/catalog/categories/services/category.service.js";
import type { ProductController } from "@/modules/catalog/products/controllers/product.controller.js";
import type { ProductService } from "@/modules/catalog/products/services/product.service.js";
import type { BannerController } from "@/modules/catalog/banners/controllers/banner.controller.js";
import type { BannerService } from "@/modules/catalog/banners/services/banner.service.js";
import type { MediaController } from "@/modules/catalog/media/controllers/media.controller.js";
import type { MediaService } from "@/modules/catalog/media/services/media.service.js";
import type { FavoriteController } from "@/modules/favorites/controllers/favorite.controller.js";
import type { FavoriteService } from "@/modules/favorites/services/favorite.service.js";
import type { AddressController } from "@/modules/addresses/controllers/address.controller.js";
import type { AddressService } from "@/modules/addresses/services/address.service.js";
import type { CouponController } from "@/modules/coupons/controllers/coupon.controller.js";
import type { CouponService } from "@/modules/coupons/services/coupon.service.js";
import type { ShippingController } from "@/modules/shipping/controllers/shipping.controller.js";
import type { ShippingService } from "@/modules/shipping/services/shipping.service.js";
import type { CartController } from "@/modules/cart/controllers/cart.controller.js";
import type { CartService } from "@/modules/cart/services/cart.service.js";
import type { OrderController } from "@/modules/orders/controllers/order.controller.js";
import type { OrderService } from "@/modules/orders/services/order.service.js";
import type { PaymentController } from "@/modules/payments/controllers/payment.controller.js";
import type { PaymentService } from "@/modules/payments/services/payment.service.js";
import type { CheckoutController } from "@/modules/checkout/controllers/checkout.controller.js";
import type { CheckoutService } from "@/modules/checkout/services/checkout.service.js";

export const TOKENS = {
  // Phase 2 providers
  userProvider: Symbol("userProvider") as ServiceToken<IUserProvider>,
  sessionProvider: Symbol("sessionProvider") as ServiceToken<ISessionProvider>,
  tokenProvider: Symbol("tokenProvider") as ServiceToken<ITokenProvider>,
  rbacProvider: Symbol("rbacProvider") as ServiceToken<IRbacProvider>,
  permissionCacheProvider: Symbol("permissionCacheProvider") as ServiceToken<IPermissionCacheProvider>,
  auditProvider: Symbol("auditProvider") as ServiceToken<IAuditProvider>,
  traceProvider: Symbol("traceProvider") as ServiceToken<ITraceProvider>,
  sseProvider: Symbol("sseProvider") as ServiceToken<ISseProvider>,
  queueProvider: Symbol("queueProvider") as ServiceToken<IQueueProvider>,
  storageProvider: Symbol("storageProvider") as ServiceToken<IStorageProvider>,
  emailProvider: Symbol("emailProvider") as ServiceToken<IEmailProvider>,
  paymentProvider: Symbol("paymentProvider") as ServiceToken<IPaymentProvider>,
  shippingProvider: Symbol("shippingProvider") as ServiceToken<IShippingProvider>,

  // Phase 2 services
  authService: Symbol("authService") as ServiceToken<AuthService>,
  authController: Symbol("authController") as ServiceToken<AuthController>,
  healthController: Symbol("healthController") as ServiceToken<HealthController>,

  // Phase 3 catalog providers
  categoryProvider: Symbol("categoryProvider") as ServiceToken<ICategoryProvider>,
  productProvider: Symbol("productProvider") as ServiceToken<IProductProvider>,
  productVariantProvider: Symbol("productVariantProvider") as ServiceToken<IProductVariantProvider>,
  productMediaProvider: Symbol("productMediaProvider") as ServiceToken<IProductMediaProvider>,
  bannerProvider: Symbol("bannerProvider") as ServiceToken<IBannerProvider>,
  publicCacheProvider: Symbol("publicCacheProvider") as ServiceToken<IPublicCacheProvider>,

  // Phase 3 catalog services
  categoryService: Symbol("categoryService") as ServiceToken<CategoryService>,
  categoryController: Symbol("categoryController") as ServiceToken<CategoryController>,
  productService: Symbol("productService") as ServiceToken<ProductService>,
  productController: Symbol("productController") as ServiceToken<ProductController>,
  bannerService: Symbol("bannerService") as ServiceToken<BannerService>,
  bannerController: Symbol("bannerController") as ServiceToken<BannerController>,
  mediaService: Symbol("mediaService") as ServiceToken<MediaService>,
  mediaController: Symbol("mediaController") as ServiceToken<MediaController>,

  // Phase 4 providers
  cartProvider: Symbol("cartProvider") as ServiceToken<ICartProvider>,
  couponProvider: Symbol("couponProvider") as ServiceToken<ICouponProvider>,
  couponUsageProvider: Symbol("couponUsageProvider") as ServiceToken<ICouponUsageProvider>,
  addressProvider: Symbol("addressProvider") as ServiceToken<IAddressProvider>,
  shippingRuleProvider: Symbol("shippingRuleProvider") as ServiceToken<IShippingRuleProvider>,
  orderProvider: Symbol("orderProvider") as ServiceToken<IOrderProvider>,
  paymentAttemptProvider: Symbol("paymentAttemptProvider") as ServiceToken<IPaymentAttemptProvider>,
  paymentWebhookEventProvider: Symbol("paymentWebhookEventProvider") as ServiceToken<IPaymentWebhookEventProvider>,
  favoriteProvider: Symbol("favoriteProvider") as ServiceToken<IFavoriteProvider>,

  // Phase 4 services
  favoriteService: Symbol("favoriteService") as ServiceToken<FavoriteService>,
  favoriteController: Symbol("favoriteController") as ServiceToken<FavoriteController>,
  addressService: Symbol("addressService") as ServiceToken<AddressService>,
  addressController: Symbol("addressController") as ServiceToken<AddressController>,
  couponService: Symbol("couponService") as ServiceToken<CouponService>,
  couponController: Symbol("couponController") as ServiceToken<CouponController>,
  shippingService: Symbol("shippingService") as ServiceToken<ShippingService>,
  shippingController: Symbol("shippingController") as ServiceToken<ShippingController>,
  cartService: Symbol("cartService") as ServiceToken<CartService>,
  cartController: Symbol("cartController") as ServiceToken<CartController>,
  orderService: Symbol("orderService") as ServiceToken<OrderService>,
  orderController: Symbol("orderController") as ServiceToken<OrderController>,
  paymentService: Symbol("paymentService") as ServiceToken<PaymentService>,
  paymentController: Symbol("paymentController") as ServiceToken<PaymentController>,
  checkoutService: Symbol("checkoutService") as ServiceToken<CheckoutService>,
  checkoutController: Symbol("checkoutController") as ServiceToken<CheckoutController>
} as const;

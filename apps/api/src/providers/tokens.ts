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
  mediaController: Symbol("mediaController") as ServiceToken<MediaController>
} as const;

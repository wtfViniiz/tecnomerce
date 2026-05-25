import type {
  IAuditProvider,
  IEmailProvider,
  IPaymentProvider,
  IPermissionCacheProvider,
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

export const TOKENS = {
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
  authService: Symbol("authService") as ServiceToken<AuthService>,
  authController: Symbol("authController") as ServiceToken<AuthController>,
  healthController: Symbol("healthController") as ServiceToken<HealthController>
} as const;

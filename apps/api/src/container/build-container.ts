import { Container } from "@/container/container.js";
import { AsyncLocalTraceProvider } from "@/core/trace/trace-provider.js";
import { AuthController, AuthService } from "@/modules/auth/index.js";
import { HealthController } from "@/modules/health/controllers/health.controller.js";
import { PrismaAuditProvider } from "@/providers/audit.provider.js";
import { RedisPermissionCacheProvider } from "@/providers/permission-cache.provider.js";
import { BullMqQueueProvider } from "@/providers/queue.js";
import { PrismaRbacProvider } from "@/providers/rbac.provider.js";
import { PrismaSessionProvider } from "@/providers/session.provider.js";
import {
  NativeSseProvider,
  StubEmailProvider,
  StubPaymentProvider,
  StubShippingProvider,
  StubStorageProvider
} from "@/providers/stub-external.providers.js";
import { JwtTokenProvider } from "@/providers/token.provider.js";
import { TOKENS } from "@/providers/tokens.js";
import { PrismaUserProvider } from "@/providers/user.provider.js";
import { checkDatabaseHealth, checkRedisHealth } from "@/providers/health.provider.js";

export const buildContainer = (): Container => {
  const container = new Container();

  const traceProvider = new AsyncLocalTraceProvider();
  const permissionCacheProvider = new RedisPermissionCacheProvider();
  const auditProvider = new PrismaAuditProvider();
  const userProvider = new PrismaUserProvider();
  const sessionProvider = new PrismaSessionProvider();
  const tokenProvider = new JwtTokenProvider();
  const rbacProvider = new PrismaRbacProvider(permissionCacheProvider);
  const queueProvider = new BullMqQueueProvider();
  const sseProvider = new NativeSseProvider();
  const storageProvider = new StubStorageProvider();
  const emailProvider = new StubEmailProvider();
  const paymentProvider = new StubPaymentProvider();
  const shippingProvider = new StubShippingProvider();
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

  return container;
};

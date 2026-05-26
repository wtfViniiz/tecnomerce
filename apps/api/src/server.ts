import { env } from "@/config/env.js";
import { initSentry } from "@/core/observability/sentry.js";
import { createApp } from "@/app/create-app.js";
import { buildContainer } from "@/container/build-container.js";
import { TOKENS } from "@/providers/tokens.js";
import type { RedisPubSubSseProvider } from "@/providers/sse.provider.js";
import { logger } from "@/core/logging/logger.js";

initSentry({
  dsn: env.SENTRY_DSN ?? "",
  environment: env.APP_ENV,
  tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0
});

const container = buildContainer();

const app = createApp({
  traceProvider: container.resolve(TOKENS.traceProvider),
  healthController: container.resolve(TOKENS.healthController),
  authController: container.resolve(TOKENS.authController),
  authService: container.resolve(TOKENS.authService),
  tokenProvider: container.resolve(TOKENS.tokenProvider),
  userProvider: container.resolve(TOKENS.userProvider),
  sessionProvider: container.resolve(TOKENS.sessionProvider),
  rbacProvider: container.resolve(TOKENS.rbacProvider),
  sseProvider: container.resolve(TOKENS.sseProvider),
  // Phase 3
  categoryController: container.resolve(TOKENS.categoryController),
  categoryService: container.resolve(TOKENS.categoryService),
  productController: container.resolve(TOKENS.productController),
  productService: container.resolve(TOKENS.productService),
  bannerController: container.resolve(TOKENS.bannerController),
  bannerService: container.resolve(TOKENS.bannerService),
  mediaController: container.resolve(TOKENS.mediaController),
  mediaService: container.resolve(TOKENS.mediaService),
  storageProvider: container.resolve(TOKENS.storageProvider)
});

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "API listening");
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, "Shutting down gracefully");

  server.close(async () => {
    try {
      const sseProvider = container.resolve(TOKENS.sseProvider) as unknown as RedisPubSubSseProvider;
      if ("shutdown" in sseProvider && typeof sseProvider.shutdown === "function") {
        await sseProvider.shutdown();
      }
      const queueProvider = container.resolve(TOKENS.queueProvider);
      if ("closeAll" in queueProvider && typeof queueProvider.closeAll === "function") {
        await queueProvider.closeAll();
      }
      logger.info("Shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error({ error }, "Error during shutdown");
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.warn("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

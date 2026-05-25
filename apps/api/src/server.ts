import { env } from "@/config/env.js";
import { createApp } from "@/app/create-app.js";
import { buildContainer } from "@/container/build-container.js";
import { TOKENS } from "@/providers/tokens.js";
import type { AuthController } from "@/modules/auth/controllers/auth.controller.js";
import type { AuthService } from "@/modules/auth/services/auth.service.js";
import type { HealthController } from "@/modules/health/controllers/health.controller.js";

const container = buildContainer();
const traceProvider = container.resolve(TOKENS.traceProvider);
const tokenProvider = container.resolve(TOKENS.tokenProvider);
const userProvider = container.resolve(TOKENS.userProvider);
const sessionProvider = container.resolve(TOKENS.sessionProvider);
const rbacProvider = container.resolve(TOKENS.rbacProvider);
const authService = container.resolve(TOKENS.authService);
const authController = container.resolve(TOKENS.authController);
const healthController = container.resolve(TOKENS.healthController);

const app = createApp({
  traceProvider,
  healthController,
  authController,
  authService,
  tokenProvider,
  userProvider,
  sessionProvider,
  rbacProvider
});

app.listen(env.PORT, () => {
  // Startup log intentionally avoids secrets and environment dumps.
  console.log(`API listening on port ${env.PORT}`);
});

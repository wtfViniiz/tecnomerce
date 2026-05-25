import { Router } from "express";

import type { HealthController } from "@/modules/health/controllers/health.controller.js";

export const createHealthRouter = (controller: HealthController): Router => {
  const router = Router();

  router.get("/health", controller.handle);

  return router;
};

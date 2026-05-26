import type { BullMqQueueProvider } from "@/providers/queue.js";
import type {
  IAuditProvider,
  IEmailProvider,
  ISseProvider,
  IStorageProvider
} from "@/providers/contracts.js";

import { registerEmailWorker } from "./email.worker.js";
import { registerAuditWorker } from "./audit.worker.js";
import { registerImageProcessingWorker } from "./image-processing.worker.js";
import { registerOrderEventsWorker } from "./order-events.worker.js";
import { registerPaymentWebhooksWorker } from "./payment-webhooks.worker.js";
import { registerSseBroadcastWorker } from "./sse-broadcast.worker.js";
import { logger } from "@/core/logging/logger.js";

type WorkerDeps = {
  queueProvider: BullMqQueueProvider;
  emailProvider: IEmailProvider;
  auditProvider: IAuditProvider;
  storageProvider: IStorageProvider;
  sseProvider: ISseProvider;
};

export function registerAllWorkers(deps: WorkerDeps): void {
  registerEmailWorker(deps.queueProvider, deps.emailProvider);
  registerAuditWorker(deps.queueProvider, deps.auditProvider);
  registerImageProcessingWorker(deps.queueProvider, deps.storageProvider);
  registerOrderEventsWorker(deps.queueProvider, deps.sseProvider);
  registerPaymentWebhooksWorker(deps.queueProvider, deps.sseProvider);
  registerSseBroadcastWorker(deps.queueProvider, deps.sseProvider);

  logger.info("All queue workers registered");
}

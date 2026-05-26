import { QUEUES } from "@/queues/queue-names.js";
import { IMAGE_PROCESSING_JOBS } from "@/queues/job-names.js";
import type { BullMqQueueProvider } from "@/providers/queue.js";
import type { IStorageProvider } from "@/providers/contracts.js";
import { logger } from "@/core/logging/logger.js";

export function registerImageProcessingWorker(
  queueProvider: BullMqQueueProvider,
  _storageProvider: IStorageProvider
): void {
  void queueProvider.process(QUEUES.IMAGE_PROCESSING, async (payload) => {
    const { jobType } = payload as { jobType: string };

    switch (jobType) {
      case IMAGE_PROCESSING_JOBS.COMPRESS: {
        const { storageKey, contentType } = payload as {
          storageKey: string;
          contentType: string;
        };
        logger.info({ storageKey, contentType }, "Image compress job received (not yet implemented)");
        break;
      }

      case IMAGE_PROCESSING_JOBS.GENERATE_RESPONSIVE: {
        const { storageKey, sizes } = payload as {
          storageKey: string;
          sizes: number[];
        };
        logger.info({ storageKey, sizes }, "Image responsive generation received (not yet implemented)");
        break;
      }

      default:
        logger.warn({ jobType }, "Unknown image-processing job type");
    }
  });
}

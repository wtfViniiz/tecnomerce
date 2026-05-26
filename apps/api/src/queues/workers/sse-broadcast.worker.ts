import { QUEUES } from "@/queues/queue-names.js";
import { SSE_BROADCAST_JOBS } from "@/queues/job-names.js";
import type { BullMqQueueProvider } from "@/providers/queue.js";
import type { ISseProvider } from "@/providers/contracts.js";
import { logger } from "@/core/logging/logger.js";

export function registerSseBroadcastWorker(
  queueProvider: BullMqQueueProvider,
  sseProvider: ISseProvider
): void {
  void queueProvider.process(QUEUES.SSE_BROADCAST, async (payload) => {
    const { jobType } = payload as { jobType: string };

    switch (jobType) {
      case SSE_BROADCAST_JOBS.BROADCAST_TO_ADMIN: {
        const { event } = payload as { event: Record<string, unknown> };
        await sseProvider.broadcast("ADMIN", event);
        logger.debug({ event }, "SSE broadcast to admin via queue");
        break;
      }

      case SSE_BROADCAST_JOBS.BROADCAST_TO_USER: {
        const { userId, event } = payload as {
          userId: string;
          event: Record<string, unknown>;
        };
        await sseProvider.publish(`user:${userId}`, event);
        logger.debug({ userId }, "SSE broadcast to user via queue");
        break;
      }

      case SSE_BROADCAST_JOBS.BROADCAST_TO_SYSTEM: {
        const { event } = payload as { event: Record<string, unknown> };
        await sseProvider.broadcast("SYSTEM", event);
        logger.debug({ event }, "SSE broadcast to system via queue");
        break;
      }

      default:
        logger.warn({ jobType }, "Unknown sse-broadcast job type");
    }
  });
}

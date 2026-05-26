import { QUEUES } from "@/queues/queue-names.js";
import { ORDER_EVENTS_JOBS } from "@/queues/job-names.js";
import type { BullMqQueueProvider } from "@/providers/queue.js";
import type { ISseProvider } from "@/providers/contracts.js";
import { logger } from "@/core/logging/logger.js";

export function registerOrderEventsWorker(
  queueProvider: BullMqQueueProvider,
  sseProvider: ISseProvider
): void {
  void queueProvider.process(QUEUES.ORDER_EVENTS, async (payload) => {
    const { jobType } = payload as { jobType: string };

    switch (jobType) {
      case ORDER_EVENTS_JOBS.ORDER_CREATED: {
        const { orderId, userId, totalAmountCents } = payload as {
          orderId: string;
          userId: string;
          totalAmountCents: number;
        };
        await sseProvider.broadcast("ADMIN", {
          type: "ORDER_CREATED",
          orderId,
          userId,
          totalAmountCents
        });
        logger.info({ orderId, userId }, "Order created event processed");
        break;
      }

      case ORDER_EVENTS_JOBS.ORDER_STATUS_CHANGED: {
        const { orderId, fromStatus, toStatus } = payload as {
          orderId: string;
          fromStatus: string;
          toStatus: string;
        };
        await sseProvider.broadcast("ADMIN", {
          type: "ORDER_STATUS_CHANGED",
          orderId,
          fromStatus,
          toStatus
        });
        logger.info({ orderId, fromStatus, toStatus }, "Order status changed event processed");
        break;
      }

      case ORDER_EVENTS_JOBS.ORDER_CANCELLED: {
        const { orderId, reason } = payload as {
          orderId: string;
          reason?: string;
        };
        await sseProvider.broadcast("ADMIN", {
          type: "ORDER_CANCELLED",
          orderId,
          reason
        });
        logger.info({ orderId }, "Order cancelled event processed");
        break;
      }

      default:
        logger.warn({ jobType }, "Unknown order-events job type");
    }
  });
}

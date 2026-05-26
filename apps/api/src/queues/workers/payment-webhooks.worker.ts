import { QUEUES } from "@/queues/queue-names.js";
import { PAYMENT_WEBHOOKS_JOBS } from "@/queues/job-names.js";
import type { BullMqQueueProvider } from "@/providers/queue.js";
import type { ISseProvider } from "@/providers/contracts.js";
import { logger } from "@/core/logging/logger.js";

export function registerPaymentWebhooksWorker(
  queueProvider: BullMqQueueProvider,
  sseProvider: ISseProvider
): void {
  void queueProvider.process(QUEUES.PAYMENT_WEBHOOKS, async (payload) => {
    const { jobType } = payload as { jobType: string };

    switch (jobType) {
      case PAYMENT_WEBHOOKS_JOBS.PROCESS_WEBHOOK: {
        const { paymentAttemptId, providerEventId, providerTopic } = payload as {
          paymentAttemptId: string;
          providerEventId: string;
          providerTopic: string;
        };
        logger.info(
          { paymentAttemptId, providerEventId, providerTopic },
          "Payment webhook processing job received"
        );
        break;
      }

      case PAYMENT_WEBHOOKS_JOBS.PAYMENT_APPROVED: {
        const { orderId, paymentAttemptId } = payload as {
          orderId: string;
          paymentAttemptId: string;
        };
        await sseProvider.broadcast("ADMIN", {
          type: "PAYMENT_APPROVED",
          orderId,
          paymentAttemptId
        });
        logger.info({ orderId, paymentAttemptId }, "Payment approved event processed");
        break;
      }

      case PAYMENT_WEBHOOKS_JOBS.PAYMENT_REJECTED: {
        const { orderId, paymentAttemptId, failureCode } = payload as {
          orderId: string;
          paymentAttemptId: string;
          failureCode?: string;
        };
        await sseProvider.broadcast("ADMIN", {
          type: "PAYMENT_REJECTED",
          orderId,
          paymentAttemptId,
          failureCode
        });
        logger.info({ orderId, paymentAttemptId }, "Payment rejected event processed");
        break;
      }

      default:
        logger.warn({ jobType }, "Unknown payment-webhooks job type");
    }
  });
}

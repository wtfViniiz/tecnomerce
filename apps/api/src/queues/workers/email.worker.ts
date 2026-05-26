import { QUEUES } from "@/queues/queue-names.js";
import { EMAIL_JOBS } from "@/queues/job-names.js";
import type { BullMqQueueProvider } from "@/providers/queue.js";
import type { IEmailProvider } from "@/providers/contracts.js";
import { logger } from "@/core/logging/logger.js";

export function registerEmailWorker(
  queueProvider: BullMqQueueProvider,
  emailProvider: IEmailProvider
): void {
  void queueProvider.process(QUEUES.EMAIL, async (payload) => {
    const { jobType } = payload as { jobType: string };

    switch (jobType) {
      case EMAIL_JOBS.SEND_TRANSACTIONAL: {
        const { to, subject, html } = payload as {
          to: string;
          subject: string;
          html: string;
        };
        await emailProvider.sendTransactional({ to, subject, html });
        logger.info({ to, subject }, "Transactional email sent via queue");
        break;
      }

      case EMAIL_JOBS.SEND_TEMPLATE: {
        const { to, templateId, variables } = payload as {
          to: string;
          templateId: string;
          variables: Record<string, string>;
        };
        await emailProvider.sendTemplate({ to, templateId, variables });
        logger.info({ to, templateId }, "Template email sent via queue");
        break;
      }

      default:
        logger.warn({ jobType }, "Unknown email job type");
    }
  });
}

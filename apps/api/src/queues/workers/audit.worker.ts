import { QUEUES } from "@/queues/queue-names.js";
import { AUDIT_JOBS } from "@/queues/job-names.js";
import type { BullMqQueueProvider } from "@/providers/queue.js";
import type { IAuditProvider, AuditEvent } from "@/providers/contracts.js";
import { logger } from "@/core/logging/logger.js";

export function registerAuditWorker(
  queueProvider: BullMqQueueProvider,
  auditProvider: IAuditProvider
): void {
  void queueProvider.process(QUEUES.AUDIT, async (payload) => {
    const { jobType } = payload as { jobType: string };

    switch (jobType) {
      case AUDIT_JOBS.EMIT_EVENT: {
        const { event } = payload as { event: AuditEvent };
        await auditProvider.emit(event);
        logger.debug(
          { eventType: event.eventType, eventCategory: event.eventCategory },
          "Audit event persisted via queue"
        );
        break;
      }

      default:
        logger.warn({ jobType }, "Unknown audit job type");
    }
  });
}

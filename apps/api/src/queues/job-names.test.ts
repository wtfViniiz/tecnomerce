import { describe, expect, it } from "vitest";

import {
  EMAIL_JOBS,
  AUDIT_JOBS,
  IMAGE_PROCESSING_JOBS,
  ORDER_EVENTS_JOBS,
  PAYMENT_WEBHOOKS_JOBS,
  SSE_BROADCAST_JOBS,
  JOB_NAMES
} from "@/queues/job-names.js";
import { QUEUES } from "@/queues/queue-names.js";

describe("Job names", () => {
  it("defines email jobs", () => {
    expect(EMAIL_JOBS.SEND_TRANSACTIONAL).toBe("send-transactional");
    expect(EMAIL_JOBS.SEND_TEMPLATE).toBe("send-template");
  });

  it("defines audit jobs", () => {
    expect(AUDIT_JOBS.EMIT_EVENT).toBe("emit-event");
  });

  it("defines image-processing jobs", () => {
    expect(IMAGE_PROCESSING_JOBS.COMPRESS).toBe("compress");
    expect(IMAGE_PROCESSING_JOBS.GENERATE_RESPONSIVE).toBe("generate-responsive");
  });

  it("defines order-events jobs", () => {
    expect(ORDER_EVENTS_JOBS.ORDER_CREATED).toBe("order-created");
    expect(ORDER_EVENTS_JOBS.ORDER_STATUS_CHANGED).toBe("order-status-changed");
    expect(ORDER_EVENTS_JOBS.ORDER_CANCELLED).toBe("order-cancelled");
  });

  it("defines payment-webhooks jobs", () => {
    expect(PAYMENT_WEBHOOKS_JOBS.PROCESS_WEBHOOK).toBe("process-webhook");
    expect(PAYMENT_WEBHOOKS_JOBS.PAYMENT_APPROVED).toBe("payment-approved");
    expect(PAYMENT_WEBHOOKS_JOBS.PAYMENT_REJECTED).toBe("payment-rejected");
  });

  it("defines sse-broadcast jobs", () => {
    expect(SSE_BROADCAST_JOBS.BROADCAST_TO_ADMIN).toBe("broadcast-to-admin");
    expect(SSE_BROADCAST_JOBS.BROADCAST_TO_USER).toBe("broadcast-to-user");
    expect(SSE_BROADCAST_JOBS.BROADCAST_TO_SYSTEM).toBe("broadcast-to-system");
  });

  it("JOB_NAMES maps all queue names to their job sets", () => {
    expect(Object.keys(JOB_NAMES)).toHaveLength(6);
    expect(JOB_NAMES[QUEUES.EMAIL]).toBe(EMAIL_JOBS);
    expect(JOB_NAMES[QUEUES.AUDIT]).toBe(AUDIT_JOBS);
    expect(JOB_NAMES[QUEUES.IMAGE_PROCESSING]).toBe(IMAGE_PROCESSING_JOBS);
    expect(JOB_NAMES[QUEUES.ORDER_EVENTS]).toBe(ORDER_EVENTS_JOBS);
    expect(JOB_NAMES[QUEUES.PAYMENT_WEBHOOKS]).toBe(PAYMENT_WEBHOOKS_JOBS);
    expect(JOB_NAMES[QUEUES.SSE_BROADCAST]).toBe(SSE_BROADCAST_JOBS);
  });
});

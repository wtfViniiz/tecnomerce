import { QUEUES } from "@/queues/queue-names.js";

export const EMAIL_JOBS = {
  SEND_TRANSACTIONAL: "send-transactional",
  SEND_TEMPLATE: "send-template"
} as const;

export const AUDIT_JOBS = {
  EMIT_EVENT: "emit-event"
} as const;

export const IMAGE_PROCESSING_JOBS = {
  COMPRESS: "compress",
  GENERATE_RESPONSIVE: "generate-responsive"
} as const;

export const ORDER_EVENTS_JOBS = {
  ORDER_CREATED: "order-created",
  ORDER_STATUS_CHANGED: "order-status-changed",
  ORDER_CANCELLED: "order-cancelled"
} as const;

export const PAYMENT_WEBHOOKS_JOBS = {
  PROCESS_WEBHOOK: "process-webhook",
  PAYMENT_APPROVED: "payment-approved",
  PAYMENT_REJECTED: "payment-rejected"
} as const;

export const SSE_BROADCAST_JOBS = {
  BROADCAST_TO_ADMIN: "broadcast-to-admin",
  BROADCAST_TO_USER: "broadcast-to-user",
  BROADCAST_TO_SYSTEM: "broadcast-to-system"
} as const;

export const JOB_NAMES = {
  [QUEUES.EMAIL]: EMAIL_JOBS,
  [QUEUES.AUDIT]: AUDIT_JOBS,
  [QUEUES.IMAGE_PROCESSING]: IMAGE_PROCESSING_JOBS,
  [QUEUES.ORDER_EVENTS]: ORDER_EVENTS_JOBS,
  [QUEUES.PAYMENT_WEBHOOKS]: PAYMENT_WEBHOOKS_JOBS,
  [QUEUES.SSE_BROADCAST]: SSE_BROADCAST_JOBS
} as const;

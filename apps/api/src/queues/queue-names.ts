/**
 * Canonical queue names defined by specs-reorganizadas/01-fase-inicializacao/08-padrao-backend-obrigatorio.md
 * All workers and producers MUST use these constants — never raw strings.
 */
export const QUEUES = {
  EMAIL: "email",
  AUDIT: "audit",
  IMAGE_PROCESSING: "image-processing",
  ORDER_EVENTS: "order-events",
  PAYMENT_WEBHOOKS: "payment-webhooks",
  SSE_BROADCAST: "sse-broadcast"
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

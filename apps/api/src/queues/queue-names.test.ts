import { describe, expect, it } from "vitest";

import { QUEUES, type QueueName } from "@/queues/queue-names.js";

describe("QUEUES constants", () => {
  it("defines exactly the 6 canonical queue names", () => {
    const names = Object.values(QUEUES);
    expect(names).toHaveLength(6);
    expect(names).toEqual(
      expect.arrayContaining([
        "email",
        "audit",
        "image-processing",
        "order-events",
        "payment-webhooks",
        "sse-broadcast"
      ])
    );
  });

  it("has correct keys matching values", () => {
    expect(QUEUES.EMAIL).toBe("email");
    expect(QUEUES.AUDIT).toBe("audit");
    expect(QUEUES.IMAGE_PROCESSING).toBe("image-processing");
    expect(QUEUES.ORDER_EVENTS).toBe("order-events");
    expect(QUEUES.PAYMENT_WEBHOOKS).toBe("payment-webhooks");
    expect(QUEUES.SSE_BROADCAST).toBe("sse-broadcast");
  });

  it("QueueName type is assignable from all values", () => {
    const name: QueueName = QUEUES.EMAIL;
    expect(typeof name).toBe("string");
  });
});

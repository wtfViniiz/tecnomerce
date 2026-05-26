import { describe, expect, it } from "vitest";

import { AsyncLocalTraceProvider } from "@/core/trace/trace-provider.js";

describe("AsyncLocalTraceProvider", () => {
  it("returns undefined when no trace context is set", () => {
    const provider = new AsyncLocalTraceProvider();
    expect(provider.getCurrentTrace()).toBeUndefined();
  });

  it("runs callback with trace context", async () => {
    const provider = new AsyncLocalTraceProvider();

    const result = provider.runWithTrace({ traceId: "t-1", requestId: "r-1" }, () => {
      const trace = provider.getCurrentTrace();
      expect(trace?.traceId).toBe("t-1");
      expect(trace?.requestId).toBe("r-1");
      return "ok";
    });

    expect(result).toBe("ok");
    expect(provider.getCurrentTrace()).toBeUndefined();
  });

  it("isolates concurrent contexts", async () => {
    const provider = new AsyncLocalTraceProvider();

    const [result1, result2] = await Promise.all([
      provider.runWithTrace({ traceId: "t-a", requestId: "r-a" }, async () => {
        await new Promise((r) => setTimeout(r, 10));
        return provider.getCurrentTrace()?.traceId;
      }),
      provider.runWithTrace({ traceId: "t-b", requestId: "r-b" }, async () => {
        await new Promise((r) => setTimeout(r, 5));
        return provider.getCurrentTrace()?.traceId;
      })
    ]);

    expect(result1).toBe("t-a");
    expect(result2).toBe("t-b");
  });

  it("generates unique trace ids", () => {
    const provider = new AsyncLocalTraceProvider();
    const id1 = provider.generateTraceId();
    const id2 = provider.generateTraceId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});

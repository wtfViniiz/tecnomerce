import { describe, expect, it, vi } from "vitest";

import { createTraceMiddleware } from "@/core/trace/trace-middleware.js";

describe("traceMiddleware", () => {
  it("sets traceId and requestId on request context", () => {
    const traceProvider = {
      generateTraceId: vi.fn(() => "test-trace-id"),
      getCurrentTrace: vi.fn(),
      runWithTrace: vi.fn((_trace: unknown, fn: () => void) => fn())
    };

    const baseLogger = {
      info: vi.fn(),
      child: vi.fn(() => ({ info: vi.fn() }))
    };

    const middleware = createTraceMiddleware(
      traceProvider as never,
      baseLogger as never
    );

    const req: Record<string, unknown> = {
      headers: { "x-request-id": "req-123" },
      ip: "127.0.0.1",
      method: "GET",
      url: "/test",
      context: {}
    };

    let nextCalled = false;
    const res: Record<string, unknown> = {
      setHeader: vi.fn(),
      on: vi.fn()
    };

    middleware(req as never, res as never, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect((req.context as Record<string, unknown>).traceId).toBe("test-trace-id");
    expect((req.context as Record<string, unknown>).requestId).toBe("test-trace-id");
    expect(traceProvider.generateTraceId).toHaveBeenCalled();
    expect(traceProvider.runWithTrace).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith("x-trace-id", "test-trace-id");
  });
});

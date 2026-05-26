import { describe, expect, it } from "vitest";

import { register, httpRequestDuration, httpRequestsTotal, authOperationsTotal, sseActiveConnections } from "@/core/metrics/metrics.js";

describe("Prometheus metrics", () => {
  it("has a valid registry", () => {
    expect(register).toBeDefined();
    expect(typeof register.metrics).toBe("function");
  });

  it("defines http_request_duration_seconds histogram", () => {
    expect(httpRequestDuration).toBeDefined();
  });

  it("defines http_requests_total counter", () => {
    expect(httpRequestsTotal).toBeDefined();
  });

  it("defines auth_operations_total counter", () => {
    expect(authOperationsTotal).toBeDefined();
  });

  it("defines sse_active_connections gauge", () => {
    expect(sseActiveConnections).toBeDefined();
  });

  it("exports metrics in Prometheus format", async () => {
    const output = await register.metrics();
    expect(typeof output).toBe("string");
    expect(output).toContain("http_request_duration_seconds");
    expect(output).toContain("http_requests_total");
    expect(output).toContain("process_cpu_user_seconds_total");
  });

  it("tracks counter increments", () => {
    httpRequestsTotal.labels("GET", "/test", "200").inc();
    const metric = httpRequestsTotal.get();
    expect(metric).toBeDefined();
  });
});

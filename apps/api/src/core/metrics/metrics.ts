import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";

export const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [register]
});

export const authOperationsTotal = new Counter({
  name: "auth_operations_total",
  help: "Total auth operations",
  labelNames: ["operation", "outcome"] as const,
  registers: [register]
});

export const sseActiveConnections = new Gauge({
  name: "sse_active_connections",
  help: "Number of active SSE connections",
  labelNames: ["scope"] as const,
  registers: [register]
});

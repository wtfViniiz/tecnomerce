import { describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("@/providers/redis.js", () => ({
  redis: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => "OK"),
    setex: vi.fn(async () => "OK"),
    del: vi.fn(async () => 1),
    incr: vi.fn(async () => 1),
    expire: vi.fn(async () => 1),
    ping: vi.fn(async () => "PONG"),
    publish: vi.fn(async () => 1),
    subscribe: vi.fn(async () => {}),
    psubscribe: vi.fn(async () => {}),
    duplicate: vi.fn(() => ({
      on: vi.fn(),
      psubscribe: vi.fn(async () => {}),
      unsubscribe: vi.fn(async () => {}),
      disconnect: vi.fn()
    })),
    on: vi.fn(),
    disconnect: vi.fn()
  }
}));

vi.mock("@/providers/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async (args: { data: Record<string, unknown> }) => ({
        id: "user-new",
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      })),
      update: vi.fn(async (args: { data: Record<string, unknown> }) => ({
        id: "user-1",
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }))
    },
    session: {
      create: vi.fn(async () => ({
        id: "session-1",
        userId: "user-1",
        chainId: "chain-1",
        refreshTokenHash: "hash",
        refreshTokenLookupHash: "lookup",
        previousRefreshTokenHash: null,
        previousRefreshTokenLookupHash: null,
        tokenVersion: 0,
        permissionsVersion: 0,
        expiresAt: new Date(Date.now() + 30 * 86400000),
        lastUsedAt: null,
        isTwoFactorVerified: true,
        stepUpVerifiedAt: null,
        revokedAt: null,
        compromisedAt: null,
        replacedBySessionId: null,
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
        deviceName: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      findUnique: vi.fn(async () => null),
      findFirst: vi.fn(async () => null),
      update: vi.fn(async () => ({})),
      updateMany: vi.fn(async () => ({ count: 0 }))
    },
    auditEvent: { create: vi.fn(async () => ({})) },
    role: { findFirst: vi.fn(async () => ({ id: "role-1", name: "admin" })) },
    userRole: { findMany: vi.fn(async () => []) },
    rolePermission: { findMany: vi.fn(async () => []) },
    $queryRaw: vi.fn(async () => [{ "?column?": 1 }])
  }
}));

// Must import after mocks are set up
const { createApp } = await import("@/app/create-app.js");
const { buildContainer } = await import("@/container/build-container.js");
const { TOKENS } = await import("@/providers/tokens.js");

const createTestApp = () => {
  const container = buildContainer();

  const app = createApp({
    traceProvider: container.resolve(TOKENS.traceProvider),
    healthController: container.resolve(TOKENS.healthController),
    authController: container.resolve(TOKENS.authController),
    authService: container.resolve(TOKENS.authService),
    tokenProvider: container.resolve(TOKENS.tokenProvider),
    userProvider: container.resolve(TOKENS.userProvider),
    sessionProvider: container.resolve(TOKENS.sessionProvider),
    rbacProvider: container.resolve(TOKENS.rbacProvider),
    sseProvider: container.resolve(TOKENS.sseProvider) as unknown as import("@/providers/sse.provider.js").RedisPubSubSseProvider,
    categoryController: container.resolve(TOKENS.categoryController),
    categoryService: container.resolve(TOKENS.categoryService),
    productController: container.resolve(TOKENS.productController),
    productService: container.resolve(TOKENS.productService),
    bannerController: container.resolve(TOKENS.bannerController),
    bannerService: container.resolve(TOKENS.bannerService),
    mediaController: container.resolve(TOKENS.mediaController),
    mediaService: container.resolve(TOKENS.mediaService),
    storageProvider: container.resolve(TOKENS.storageProvider),
    favoriteController: container.resolve(TOKENS.favoriteController),
    addressController: container.resolve(TOKENS.addressController),
    couponController: container.resolve(TOKENS.couponController),
    shippingController: container.resolve(TOKENS.shippingController),
    cartController: container.resolve(TOKENS.cartController),
    orderController: container.resolve(TOKENS.orderController),
    paymentController: container.resolve(TOKENS.paymentController),
    checkoutController: container.resolve(TOKENS.checkoutController)
  });

  return { app, container };
};

describe("Auth integration", () => {
  describe("POST /api/v1/auth/register", () => {
    it("returns 201 with accessToken on valid input", async () => {
      const { app } = createTestApp();

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ name: "New User", email: "new@example.com", password: "strongpassword123" });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("returns 400 when email is missing", async () => {
      const { app } = createTestApp();

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ name: "User", password: "strongpassword123" });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
    });

    it("returns 400 when password is too short", async () => {
      const { app } = createTestApp();

      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ name: "User", email: "a@b.com", password: "123" });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("error");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("returns 401 on invalid credentials (user not found)", async () => {
      const { app } = createTestApp();

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "wrong@example.com", password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe("error");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("returns 401 without auth token", async () => {
      const { app } = createTestApp();

      const res = await request(app).get("/api/v1/auth/me");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("returns 401 without refresh cookie", async () => {
      const { app } = createTestApp();

      const res = await request(app).post("/api/v1/auth/refresh");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/health", () => {
    it("returns 200 with status ok", async () => {
      const { app } = createTestApp();

      const res = await request(app).get("/api/v1/health");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.status).toBe("ok");
    });
  });

  describe("GET /metrics", () => {
    it("returns Prometheus metrics", async () => {
      const { app } = createTestApp();

      const res = await request(app).get("/metrics");

      expect(res.status).toBe(200);
      expect(res.text).toContain("http_requests_total");
    });
  });
});

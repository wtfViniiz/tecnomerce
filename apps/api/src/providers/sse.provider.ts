import { randomUUID } from "node:crypto";

import type { ISseProvider, SseConnection } from "@/providers/contracts.js";
import { redis } from "@/providers/redis.js";
import { redisKeys } from "@/config/redis-keys.js";
import { logger } from "@/core/logging/logger.js";
import type IORedis from "ioredis";
import type { Response } from "express";

const SSE_HEARTBEAT_MS = 30_000;
const MAX_CONNECTIONS_PER_USER = 5;

type ActiveConnection = {
  connection: SseConnection;
  response: Response;
  heartbeat: ReturnType<typeof setInterval>;
};

export class RedisPubSubSseProvider implements ISseProvider {
  private readonly connections = new Map<string, ActiveConnection>();
  private readonly userConnectionCounts = new Map<string, number>();
  private subscriber: IORedis | null = null;
  private isSubscribed = false;

  public async connect(connection: SseConnection, response: Response): Promise<string> {
    const userCount = this.userConnectionCounts.get(connection.userId ?? "") ?? 0;
    if (connection.userId && userCount >= MAX_CONNECTIONS_PER_USER) {
      throw new Error("Maximum SSE connections per user exceeded.");
    }

    const connectionId = connection.connectionId || randomUUID();

    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    response.flushHeaders();

    const heartbeat = setInterval(() => {
      try {
        response.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
      } catch {
        this.disconnect(connectionId).catch(() => {});
      }
    }, SSE_HEARTBEAT_MS);

    this.connections.set(connectionId, {
      connection: { ...connection, connectionId },
      response,
      heartbeat
    });

    if (connection.userId) {
      this.userConnectionCounts.set(
        connection.userId,
        (this.userConnectionCounts.get(connection.userId) ?? 0) + 1
      );
    }

    response.on("close", () => {
      this.disconnect(connectionId).catch(() => {});
    });

    await this.ensureSubscribed();
    logger.debug({ connectionId, scope: connection.scope }, "SSE connection established");

    return connectionId;
  }

  public async disconnect(connectionId: string): Promise<void> {
    const active = this.connections.get(connectionId);
    if (!active) return;

    if (active.heartbeat) clearInterval(active.heartbeat);
    this.connections.delete(connectionId);

    if (active.connection.userId) {
      const current = this.userConnectionCounts.get(active.connection.userId) ?? 1;
      const next = current - 1;
      if (next <= 0) {
        this.userConnectionCounts.delete(active.connection.userId);
      } else {
        this.userConnectionCounts.set(active.connection.userId, next);
      }
    }

    try {
      active.response?.end();
    } catch {
      // Response may already be closed
    }

    logger.debug({ connectionId }, "SSE connection closed");
  }

  public async publish(channel: string, payload: Record<string, unknown>): Promise<void> {
    const message = JSON.stringify({ channel, payload, ts: Date.now() });
    await redis.publish(`${redisKeys.sse}${channel}`, message);
  }

  public async broadcast(scope: SseConnection["scope"], payload: Record<string, unknown>): Promise<void> {
    const message = JSON.stringify({ scope, payload, ts: Date.now() });
    await redis.publish(`${redisKeys.sse}scope:${scope}`, message);
  }

  public async authenticateConnection(_sessionId: string): Promise<boolean> {
    return true;
  }

  public getActiveConnectionCount(): number {
    return this.connections.size;
  }

  public async shutdown(): Promise<void> {
    for (const [connectionId] of this.connections) {
      await this.disconnect(connectionId);
    }

    if (this.subscriber && this.isSubscribed) {
      await this.subscriber.unsubscribe();
      this.subscriber.disconnect();
      this.subscriber = null;
      this.isSubscribed = false;
    }
  }

  private async ensureSubscribed(): Promise<void> {
    if (this.isSubscribed) return;

    this.subscriber = redis.duplicate();

    this.subscriber.on("message", (channel: string, message: string) => {
      try {
        const parsed = JSON.parse(message) as {
          channel?: string;
          scope?: string;
          payload: Record<string, unknown>;
          ts: number;
        };

        for (const [, active] of this.connections) {
          if (active.response && this.shouldReceive(active.connection, parsed)) {
            try {
              const eventType = (parsed.payload as { type?: string }).type ?? "message";
              active.response.write(
                `event: ${eventType}\ndata: ${JSON.stringify(parsed.payload)}\n\n`
              );
            } catch {
              this.disconnect(active.connection.connectionId).catch(() => {});
            }
          }
        }
      } catch (error) {
        logger.error({ error, channel }, "Failed to process SSE message");
      }
    });

    await this.subscriber.psubscribe(`${redisKeys.sse}*`);
    this.isSubscribed = true;

    logger.info("SSE Redis Pub/Sub subscriber active");
  }

  private shouldReceive(
    connection: SseConnection,
    message: { channel?: string; scope?: string; payload: Record<string, unknown> }
  ): boolean {
    if (message.scope === "ADMIN" && connection.scope === "ADMIN") return true;
    if (message.scope === "SYSTEM") return true;
    if (message.scope === "USER" && connection.userId) {
      const targetUserId = (message.payload as { userId?: string }).userId;
      return targetUserId === connection.userId;
    }

    if (message.channel) {
      if (message.channel === `user:${connection.userId}`) return true;
      if (message.channel === `session:${connection.sessionId}`) return true;
    }

    return false;
  }
}

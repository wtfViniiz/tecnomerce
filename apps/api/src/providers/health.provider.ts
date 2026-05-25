import { prisma } from "@/providers/prisma.js";
import { redis } from "@/providers/redis.js";

export const checkDatabaseHealth = async (): Promise<"up" | "down"> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "up";
  } catch {
    return "down";
  }
};

export const checkRedisHealth = async (): Promise<"up" | "down"> => {
  try {
    const pong = await redis.ping();
    return pong === "PONG" ? "up" : "down";
  } catch {
    return "down";
  }
};

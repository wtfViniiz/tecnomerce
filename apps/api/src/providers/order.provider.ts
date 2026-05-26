import type {
  OrderRecord,
  OrderStatusHistoryRecord,
  IOrderProvider
} from "@/providers/contracts-fase4.js";
import { prisma } from "@/providers/prisma.js";
import { OrderStatus, AuditActorType } from "@prisma/client";

const mapOrder = (order: {
  id: string;
  userId: string;
  status: string;
  currencyCode: string;
  subtotalCents: number;
  discountAmountCents: number;
  shippingAmountCents: number;
  totalAmountCents: number;
  couponId: string | null;
  shippingMethodId: string | null;
  placedAt: Date | null;
  cancelledAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): OrderRecord => ({
  id: order.id,
  userId: order.userId,
  status: order.status as OrderRecord["status"],
  currencyCode: order.currencyCode,
  subtotalCents: order.subtotalCents,
  discountAmountCents: order.discountAmountCents,
  shippingAmountCents: order.shippingAmountCents,
  totalAmountCents: order.totalAmountCents,
  couponId: order.couponId,
  shippingMethodId: order.shippingMethodId,
  placedAt: order.placedAt,
  cancelledAt: order.cancelledAt,
  paidAt: order.paidAt,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt
});

const mapOrderStatusHistory = (history: {
  id: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  actorType: string;
  actorUserId: string | null;
  traceId: string;
  createdAt: Date;
}): OrderStatusHistoryRecord => ({
  id: history.id,
  orderId: history.orderId,
  fromStatus: history.fromStatus,
  toStatus: history.toStatus,
  reason: history.reason,
  actorType: history.actorType,
  actorUserId: history.actorUserId,
  traceId: history.traceId,
  createdAt: history.createdAt
});

export class PrismaOrderProvider implements IOrderProvider {
  public async findById(id: string): Promise<OrderRecord | null> {
    const order = await prisma.order.findUnique({ where: { id } });
    return order ? mapOrder(order) : null;
  }

  public async listByUserId(userId: string): Promise<OrderRecord[]> {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    return orders.map(mapOrder);
  }

  public async list(options: {
    status?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: OrderRecord[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.userId) {
      where.userId = options.userId;
    }

    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset
      }),
      prisma.order.count({ where })
    ]);

    return { items: items.map(mapOrder), total };
  }

  public async create(
    input: Omit<OrderRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<OrderRecord> {
    const order = await prisma.order.create({
      data: {
        userId: input.userId,
        status: input.status,
        currencyCode: input.currencyCode,
        subtotalCents: input.subtotalCents,
        discountAmountCents: input.discountAmountCents,
        shippingAmountCents: input.shippingAmountCents,
        totalAmountCents: input.totalAmountCents,
        couponId: input.couponId,
        shippingMethodId: input.shippingMethodId,
        placedAt: input.placedAt,
        cancelledAt: input.cancelledAt,
        paidAt: input.paidAt
      }
    });

    return mapOrder(order);
  }

  public async updateStatus(id: string, status: OrderRecord["status"]): Promise<OrderRecord> {
    const data: Record<string, unknown> = { status };

    // Set timestamps based on status transitions
    if (status === "PAID") {
      data.paidAt = new Date();
    } else if (status === "CANCELLED") {
      data.cancelledAt = new Date();
    } else if (status === "WAITING_PAYMENT") {
      data.placedAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id },
      data
    });

    return mapOrder(order);
  }

  public async addStatusHistory(
    input: Omit<OrderStatusHistoryRecord, "id" | "createdAt">
  ): Promise<OrderStatusHistoryRecord> {
    const history = await prisma.orderStatusHistory.create({
      data: {
        orderId: input.orderId,
        ...(input.fromStatus !== undefined && { fromStatus: input.fromStatus as OrderStatus }),
        toStatus: input.toStatus as OrderStatus,
        reason: input.reason,
        actorType: input.actorType as AuditActorType,
        actorUserId: input.actorUserId,
        traceId: input.traceId
      }
    });

    return mapOrderStatusHistory(history);
  }
}

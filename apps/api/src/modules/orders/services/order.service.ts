import { ResourceError } from "@/core/errors/resource-error.js";
import { RequestError } from "@/core/errors/request-error.js";
import type {
  OrderRecord,
  OrderItemRecord,
  OrderAddressRecord,
  OrderStatusHistoryRecord,
  IOrderProvider
} from "@/providers/contracts-fase4.js";
import type { IAuditProvider } from "@/providers/contracts.js";
import { prisma } from "@/providers/prisma.js";

type ServiceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
};

export class OrderService {
  public constructor(
    private readonly orderProvider: IOrderProvider,
    private readonly auditProvider: IAuditProvider
  ) {}

  public async getById(id: string): Promise<OrderRecord> {
    const order = await this.orderProvider.findById(id);
    if (!order) {
      throw new ResourceError("ORDER.NOT_FOUND", "Order not found.");
    }
    return order;
  }

  public async getDetail(id: string): Promise<{
    order: OrderRecord;
    items: OrderItemRecord[];
    address: OrderAddressRecord | null;
    statusHistory: OrderStatusHistoryRecord[];
  }> {
    const order = await this.getById(id);

    const [items, address, statusHistory] = await Promise.all([
      prisma.orderItem.findMany({
        where: { orderId: id },
        orderBy: { createdAt: "asc" }
      }),
      prisma.orderAddress.findUnique({ where: { orderId: id } }),
      prisma.orderStatusHistory.findMany({
        where: { orderId: id },
        orderBy: { createdAt: "asc" }
      })
    ]);

    return {
      order,
      items: items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productVariantId: item.productVariantId,
        productNameSnapshot: item.productNameSnapshot,
        productSlugSnapshot: item.productSlugSnapshot,
        skuSnapshot: item.skuSnapshot,
        categoryNameSnapshot: item.categoryNameSnapshot,
        fabricNameSnapshot: item.fabricNameSnapshot,
        sizeNameSnapshot: item.sizeNameSnapshot,
        colorNameSnapshot: item.colorNameSnapshot,
        quantity: item.quantity,
        unitBasePriceCents: item.unitBasePriceCents,
        unitPromotionalPriceCents: item.unitPromotionalPriceCents,
        unitCustomizationPriceCents: item.unitCustomizationPriceCents,
        unitFinalPriceCents: item.unitFinalPriceCents,
        currencyCode: item.currencyCode,
        customName: item.customName,
        customNumber: item.customNumber,
        customNotes: item.customNotes,
        createdAt: item.createdAt
      })),
      address: address
        ? {
            id: address.id,
            orderId: address.orderId,
            recipientName: address.recipientName,
            phone: address.phone,
            postalCode: address.postalCode,
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            countryCode: address.countryCode,
            addressType: address.addressType as OrderAddressRecord["addressType"],
            createdAt: address.createdAt
          }
        : null,
      statusHistory: statusHistory.map((h) => ({
        id: h.id,
        orderId: h.orderId,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        reason: h.reason,
        actorType: h.actorType,
        actorUserId: h.actorUserId,
        traceId: h.traceId,
        createdAt: h.createdAt
      }))
    };
  }

  public async listByUserId(userId: string): Promise<OrderRecord[]> {
    return this.orderProvider.listByUserId(userId);
  }

  public async list(options: {
    status?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: OrderRecord[]; total: number }> {
    const limit = options.limit ?? 20;
    const page = options.page ?? 1;
    const offset = (page - 1) * limit;

    const listOptions: { status?: string; userId?: string; limit: number; offset: number } = {
      limit,
      offset
    };
    if (options.status !== undefined) listOptions.status = options.status;
    if (options.userId !== undefined) listOptions.userId = options.userId;

    return this.orderProvider.list(listOptions);
  }

  public async cancel(id: string, context: ServiceContext, reason?: string): Promise<OrderRecord> {
    const order = await this.getById(id);

    const nonCancellable: OrderRecord["status"][] = [
      "CANCELLED",
      "REFUNDED",
      "DELIVERED",
      "SHIPPED"
    ];

    if (nonCancellable.includes(order.status)) {
      throw new RequestError(
        "ORDER.CANNOT_CANCEL",
        `Cannot cancel order with status ${order.status}.`
      );
    }

    const updated = await this.orderProvider.updateStatus(id, "CANCELLED");

    await this.orderProvider.addStatusHistory({
      orderId: id,
      fromStatus: order.status,
      toStatus: "CANCELLED",
      reason: reason ?? "Cancelled by user",
      actorType: context.userId ? "USER" : "SYSTEM",
      actorUserId: context.userId ?? null,
      traceId: context.traceId
    });

    await this.auditProvider.emit({
      eventType: "ORDER_CANCELLED",
      eventCategory: "ORDER",
      actorType: context.userId ? "USER" : "SYSTEM",
      ...(context.userId !== undefined ? { actorUserId: context.userId } : {}),
      targetType: "ORDER",
      targetId: id,
      traceId: context.traceId,
      requestId: context.requestId,
      metadata: { fromStatus: order.status },
      outcome: "SUCCESS"
    });

    return updated;
  }
}

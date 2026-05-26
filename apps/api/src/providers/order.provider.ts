import type {
  OrderRecord,
  OrderStatusHistoryRecord,
  OrderItemRecord,
  OrderAddressRecord,
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

const mapOrderItem = (item: {
  id: string;
  orderId: string;
  productId: string | null;
  productVariantId: string | null;
  productNameSnapshot: string;
  productSlugSnapshot: string;
  skuSnapshot: string;
  categoryNameSnapshot: string | null;
  fabricNameSnapshot: string | null;
  sizeNameSnapshot: string | null;
  colorNameSnapshot: string | null;
  quantity: number;
  unitBasePriceCents: number;
  unitPromotionalPriceCents: number | null;
  unitCustomizationPriceCents: number;
  unitFinalPriceCents: number;
  currencyCode: string;
  customName: string | null;
  customNumber: string | null;
  customNotes: string | null;
  createdAt: Date;
}): OrderItemRecord => ({
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
});

const mapOrderAddress = (address: {
  id: string;
  orderId: string;
  recipientName: string;
  phone: string | null;
  postalCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  countryCode: string;
  addressType: string;
  createdAt: Date;
}): OrderAddressRecord => ({
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

  public async createItem(
    input: Omit<OrderItemRecord, "id" | "createdAt">
  ): Promise<OrderItemRecord> {
    const item = await prisma.orderItem.create({
      data: {
        orderId: input.orderId,
        productId: input.productId,
        productVariantId: input.productVariantId,
        productNameSnapshot: input.productNameSnapshot,
        productSlugSnapshot: input.productSlugSnapshot,
        skuSnapshot: input.skuSnapshot,
        categoryNameSnapshot: input.categoryNameSnapshot,
        fabricNameSnapshot: input.fabricNameSnapshot,
        sizeNameSnapshot: input.sizeNameSnapshot,
        colorNameSnapshot: input.colorNameSnapshot,
        quantity: input.quantity,
        unitBasePriceCents: input.unitBasePriceCents,
        unitPromotionalPriceCents: input.unitPromotionalPriceCents,
        unitCustomizationPriceCents: input.unitCustomizationPriceCents,
        unitFinalPriceCents: input.unitFinalPriceCents,
        currencyCode: input.currencyCode,
        customName: input.customName,
        customNumber: input.customNumber,
        customNotes: input.customNotes
      }
    });
    return mapOrderItem(item);
  }

  public async createAddress(
    input: Omit<OrderAddressRecord, "id" | "createdAt">
  ): Promise<OrderAddressRecord> {
    const address = await prisma.orderAddress.create({
      data: {
        orderId: input.orderId,
        recipientName: input.recipientName,
        phone: input.phone,
        postalCode: input.postalCode,
        street: input.street,
        number: input.number,
        complement: input.complement,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
        countryCode: input.countryCode,
        addressType: input.addressType
      }
    });
    return mapOrderAddress(address);
  }

  public async listItems(orderId: string): Promise<OrderItemRecord[]> {
    const items = await prisma.orderItem.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" }
    });
    return items.map(mapOrderItem);
  }

  public async findAddressByOrderId(orderId: string): Promise<OrderAddressRecord | null> {
    const address = await prisma.orderAddress.findFirst({
      where: { orderId }
    });
    return address ? mapOrderAddress(address) : null;
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

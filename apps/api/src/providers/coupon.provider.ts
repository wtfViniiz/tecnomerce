import type { CouponRecord, CouponUsageRecord, CouponRestrictionRecord, ICouponProvider, ICouponUsageProvider, ICouponRestrictionProvider } from "@/providers/contracts-fase4.js";
import { prisma } from "@/providers/prisma.js";

const mapCoupon = (coupon: {
  id: string;
  code: string;
  type: string;
  valueCentsOrPercentage: number;
  currencyCode: string;
  status: string;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  minimumOrderAmountCents: number | null;
  isStackable: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}): CouponRecord => ({
  id: coupon.id,
  code: coupon.code,
  type: coupon.type as CouponRecord["type"],
  valueCentsOrPercentage: coupon.valueCentsOrPercentage,
  currencyCode: coupon.currencyCode,
  status: coupon.status as CouponRecord["status"],
  maxUses: coupon.maxUses,
  maxUsesPerUser: coupon.maxUsesPerUser,
  usedCount: coupon.usedCount,
  startsAt: coupon.startsAt,
  expiresAt: coupon.expiresAt,
  minimumOrderAmountCents: coupon.minimumOrderAmountCents,
  isStackable: coupon.isStackable,
  createdAt: coupon.createdAt,
  updatedAt: coupon.updatedAt,
  deletedAt: coupon.deletedAt,
  createdByUserId: coupon.createdByUserId,
  updatedByUserId: coupon.updatedByUserId
});

const mapCouponUsage = (usage: {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  usedAt: Date;
}): CouponUsageRecord => ({
  id: usage.id,
  couponId: usage.couponId,
  userId: usage.userId,
  orderId: usage.orderId,
  usedAt: usage.usedAt
});

export class PrismaCouponProvider implements ICouponProvider {
  public async findById(id: string): Promise<CouponRecord | null> {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    return coupon ? mapCoupon(coupon) : null;
  }

  public async findByCode(code: string): Promise<CouponRecord | null> {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    return coupon ? mapCoupon(coupon) : null;
  }

  public async list(options: { status?: string; includeDeleted?: boolean }): Promise<CouponRecord[]> {
    const where: Record<string, unknown> = {};

    if (!options.includeDeleted) {
      where.deletedAt = null;
    }

    if (options.status) {
      where.status = options.status;
    }

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    return coupons.map(mapCoupon);
  }

  public async create(
    input: Omit<CouponRecord, "id" | "createdAt" | "updatedAt" | "deletedAt" | "usedCount">
  ): Promise<CouponRecord> {
    const coupon = await prisma.coupon.create({
      data: {
        code: input.code,
        type: input.type,
        valueCentsOrPercentage: input.valueCentsOrPercentage,
        currencyCode: input.currencyCode,
        status: input.status,
        maxUses: input.maxUses,
        maxUsesPerUser: input.maxUsesPerUser,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        minimumOrderAmountCents: input.minimumOrderAmountCents,
        isStackable: input.isStackable,
        createdByUserId: input.createdByUserId,
        updatedByUserId: input.updatedByUserId
      }
    });

    return mapCoupon(coupon);
  }

  public async update(id: string, input: Partial<CouponRecord>): Promise<CouponRecord> {
    const data: Record<string, unknown> = {};

    if (input.code !== undefined) data.code = input.code;
    if (input.type !== undefined) data.type = input.type;
    if (input.valueCentsOrPercentage !== undefined) data.valueCentsOrPercentage = input.valueCentsOrPercentage;
    if (input.currencyCode !== undefined) data.currencyCode = input.currencyCode;
    if (input.status !== undefined) data.status = input.status;
    if (input.maxUses !== undefined) data.maxUses = input.maxUses;
    if (input.maxUsesPerUser !== undefined) data.maxUsesPerUser = input.maxUsesPerUser;
    if (input.startsAt !== undefined) data.startsAt = input.startsAt;
    if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt;
    if (input.minimumOrderAmountCents !== undefined) data.minimumOrderAmountCents = input.minimumOrderAmountCents;
    if (input.isStackable !== undefined) data.isStackable = input.isStackable;
    if (input.updatedByUserId !== undefined) data.updatedByUserId = input.updatedByUserId;

    const coupon = await prisma.coupon.update({
      where: { id },
      data
    });

    return mapCoupon(coupon);
  }

  public async softDelete(id: string, deletedAt: Date): Promise<void> {
    await prisma.coupon.update({
      where: { id },
      data: { deletedAt }
    });
  }

  public async incrementUsage(id: string): Promise<void> {
    await prisma.coupon.update({
      where: { id },
      data: { usedCount: { increment: 1 } }
    });
  }
}

export class PrismaCouponUsageProvider implements ICouponUsageProvider {
  public async create(
    input: Omit<CouponUsageRecord, "id" | "usedAt">
  ): Promise<CouponUsageRecord> {
    const usage = await prisma.couponUsage.create({
      data: {
        couponId: input.couponId,
        userId: input.userId,
        orderId: input.orderId
      }
    });
    return mapCouponUsage(usage);
  }

  public async findByCouponAndUser(couponId: string, userId: string): Promise<CouponUsageRecord[]> {
    const usages = await prisma.couponUsage.findMany({
      where: { couponId, userId },
      orderBy: { usedAt: "desc" }
    });
    return usages.map(mapCouponUsage);
  }

  public async countByCouponAndUser(couponId: string, userId: string): Promise<number> {
    return prisma.couponUsage.count({
      where: { couponId, userId }
    });
  }
}

export class PrismaCouponRestrictionProvider implements ICouponRestrictionProvider {
  public async findByCouponId(couponId: string): Promise<CouponRestrictionRecord[]> {
    const restrictions = await prisma.couponRestriction.findMany({
      where: { couponId }
    });
    return restrictions.map((r) => ({
      id: r.id,
      couponId: r.couponId,
      productId: r.productId,
      categoryId: r.categoryId
    }));
  }

  public async create(input: Omit<CouponRestrictionRecord, "id">): Promise<CouponRestrictionRecord> {
    const restriction = await prisma.couponRestriction.create({
      data: {
        couponId: input.couponId,
        productId: input.productId,
        categoryId: input.categoryId
      }
    });
    return {
      id: restriction.id,
      couponId: restriction.couponId,
      productId: restriction.productId,
      categoryId: restriction.categoryId
    };
  }

  public async deleteByCouponId(couponId: string): Promise<void> {
    await prisma.couponRestriction.deleteMany({ where: { couponId } });
  }

  public async checkProductEligible(couponId: string, productIds: string[], categoryIds: string[]): Promise<boolean> {
    const restrictions = await this.findByCouponId(couponId);
    if (restrictions.length === 0) return true; // No restrictions = all products eligible

    return restrictions.some(
      (r) =>
        (r.productId !== null && productIds.includes(r.productId)) ||
        (r.categoryId !== null && categoryIds.includes(r.categoryId))
    );
  }
}

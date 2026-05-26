import { ResourceError } from "@/core/errors/resource-error.js";
import { RequestError } from "@/core/errors/request-error.js";
import type { CouponRecord, ICouponProvider, ICouponUsageProvider, ICouponRestrictionProvider } from "@/providers/contracts-fase4.js";
import type { IAuditProvider } from "@/providers/contracts.js";
import type { CreateCouponInput, UpdateCouponInput } from "@/modules/coupons/schemas/coupon.schema.js";

type ServiceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
};

export class CouponService {
  public constructor(
    private readonly couponProvider: ICouponProvider,
    private readonly couponUsageProvider: ICouponUsageProvider,
    private readonly couponRestrictionProvider: ICouponRestrictionProvider,
    private readonly auditProvider: IAuditProvider
  ) {}

  public async list(options?: { status?: string }): Promise<CouponRecord[]> {
    const listOptions: { status?: string; includeDeleted?: boolean } = { includeDeleted: false };
    if (options?.status !== undefined) {
      listOptions.status = options.status;
    }
    return this.couponProvider.list(listOptions);
  }

  public async getById(id: string): Promise<CouponRecord> {
    const coupon = await this.couponProvider.findById(id);
    if (!coupon || coupon.deletedAt) {
      throw new ResourceError("COUPON.NOT_FOUND", "Coupon not found.");
    }
    return coupon;
  }

  public async getByCode(code: string): Promise<CouponRecord> {
    const coupon = await this.couponProvider.findByCode(code);
    if (!coupon || coupon.deletedAt) {
      throw new ResourceError("COUPON.NOT_FOUND", "Coupon not found.");
    }
    return coupon;
  }

  public async create(input: CreateCouponInput, context: ServiceContext): Promise<CouponRecord> {
    const existing = await this.couponProvider.findByCode(input.code);
    if (existing) {
      throw new RequestError("COUPON.CODE_EXISTS", "A coupon with this code already exists.");
    }

    const coupon = await this.couponProvider.create({
      code: input.code,
      type: input.type,
      valueCentsOrPercentage: input.valueCentsOrPercentage,
      currencyCode: input.currencyCode,
      status: input.status,
      maxUses: input.maxUses ?? null,
      maxUsesPerUser: input.maxUsesPerUser ?? null,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      minimumOrderAmountCents: input.minimumOrderAmountCents ?? null,
      isStackable: input.isStackable,
      createdByUserId: context.userId ?? null,
      updatedByUserId: context.userId ?? null
    });

    // Persist restrictions if provided
    if (input.restrictions && input.restrictions.length > 0) {
      for (const restriction of input.restrictions) {
        await this.couponRestrictionProvider.create({
          couponId: coupon.id,
          productId: restriction.productId ?? null,
          categoryId: restriction.categoryId ?? null
        });
      }
    }

    await this.auditProvider.emit({
      eventType: "COUPON_CREATED",
      eventCategory: "COUPON",
      actorType: context.userId ? "ADMIN" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "COUPON",
      targetId: coupon.id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });

    return coupon;
  }

  public async update(id: string, input: UpdateCouponInput, context: ServiceContext): Promise<CouponRecord> {
    const existing = await this.couponProvider.findById(id);
    if (!existing || existing.deletedAt) {
      throw new ResourceError("COUPON.NOT_FOUND", "Coupon not found.");
    }

    if (input.code && input.code !== existing.code) {
      const duplicate = await this.couponProvider.findByCode(input.code);
      if (duplicate) {
        throw new RequestError("COUPON.CODE_EXISTS", "A coupon with this code already exists.");
      }
    }

    const updateData: Partial<CouponRecord> = {};

    if (input.code !== undefined) updateData.code = input.code;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.valueCentsOrPercentage !== undefined) updateData.valueCentsOrPercentage = input.valueCentsOrPercentage;
    if (input.currencyCode !== undefined) updateData.currencyCode = input.currencyCode;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.maxUses !== undefined) updateData.maxUses = input.maxUses ?? null;
    if (input.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = input.maxUsesPerUser ?? null;
    if (input.startsAt !== undefined) updateData.startsAt = input.startsAt ? new Date(input.startsAt) : null;
    if (input.expiresAt !== undefined) updateData.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    if (input.minimumOrderAmountCents !== undefined) updateData.minimumOrderAmountCents = input.minimumOrderAmountCents ?? null;
    if (input.isStackable !== undefined) updateData.isStackable = input.isStackable;
    updateData.updatedByUserId = context.userId ?? null;

    const coupon = await this.couponProvider.update(id, updateData);

    await this.auditProvider.emit({
      eventType: "COUPON_UPDATED",
      eventCategory: "COUPON",
      actorType: context.userId ? "ADMIN" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "COUPON",
      targetId: coupon.id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });

    return coupon;
  }

  public async softDelete(id: string, context: ServiceContext): Promise<void> {
    const existing = await this.couponProvider.findById(id);
    if (!existing || existing.deletedAt) {
      throw new ResourceError("COUPON.NOT_FOUND", "Coupon not found.");
    }

    await this.couponProvider.softDelete(id, new Date());

    await this.auditProvider.emit({
      eventType: "COUPON_DELETED",
      eventCategory: "COUPON",
      actorType: context.userId ? "ADMIN" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "COUPON",
      targetId: id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });
  }

  public async validateForOrder(code: string, userId: string, orderAmountCents: number): Promise<CouponRecord> {
    const coupon = await this.couponProvider.findByCode(code);
    if (!coupon || coupon.deletedAt) {
      throw new ResourceError("COUPON.NOT_FOUND", "Coupon not found.");
    }

    if (coupon.status !== "ACTIVE") {
      throw new RequestError("COUPON.INACTIVE", "This coupon is not active.");
    }

    const now = new Date();

    if (coupon.expiresAt && coupon.expiresAt <= now) {
      throw new RequestError("COUPON.EXPIRED", "This coupon has expired.");
    }

    if (coupon.startsAt && coupon.startsAt > now) {
      throw new RequestError("COUPON.NOT_STARTED", "This coupon is not yet valid.");
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new RequestError("COUPON.MAX_USES_REACHED", "This coupon has reached its usage limit.");
    }

    if (coupon.minimumOrderAmountCents !== null && orderAmountCents < coupon.minimumOrderAmountCents) {
      throw new RequestError("COUPON.MINIMUM_NOT_MET", "Order does not meet the minimum amount for this coupon.");
    }

    if (coupon.maxUsesPerUser !== null) {
      const userUsageCount = await this.couponUsageProvider.countByCouponAndUser(coupon.id, userId);
      if (userUsageCount >= coupon.maxUsesPerUser) {
        throw new RequestError("COUPON.USER_LIMIT_REACHED", "You have already used this coupon the maximum number of times.");
      }
    }

    return coupon;
  }
}

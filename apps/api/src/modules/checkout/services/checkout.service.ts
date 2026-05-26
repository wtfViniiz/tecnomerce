import { ResourceError } from "@/core/errors/resource-error.js";
import { CheckoutError } from "@/core/errors/checkout-error.js";
import type {
  CartRecord,
  CartItemRecord,
  OrderRecord,
  ICartProvider,
  IAddressProvider,
  IShippingRuleProvider,
  ICouponProvider,
  ICouponUsageProvider,
  IOrderProvider,
  IPaymentAttemptProvider
} from "@/providers/contracts-fase4.js";
import type { IProductVariantProvider, IAuditProvider } from "@/providers/contracts.js";
import type { CheckoutInput } from "@/modules/checkout/schemas/checkout.schema.js";

type ServiceContext = {
  traceId: string;
  requestId: string;
  userId: string;
};

type CheckoutResult = {
  order: OrderRecord;
  paymentAttemptId: string;
};

export class CheckoutService {
  public constructor(
    private readonly cartProvider: ICartProvider,
    private readonly addressProvider: IAddressProvider,
    private readonly shippingRuleProvider: IShippingRuleProvider,
    private readonly couponProvider: ICouponProvider,
    private readonly couponUsageProvider: ICouponUsageProvider,
    private readonly orderProvider: IOrderProvider,
    private readonly paymentAttemptProvider: IPaymentAttemptProvider,
    private readonly productVariantProvider: IProductVariantProvider,
    private readonly auditProvider: IAuditProvider
  ) {}

  public async checkout(input: CheckoutInput, context: ServiceContext): Promise<CheckoutResult> {
    // 1. Get active cart
    const cart = await this.cartProvider.findActiveByUserId(context.userId);
    if (!cart) {
      throw new CheckoutError("CHECKOUT.NO_CART", "No active cart found.");
    }

    const items = await this.cartProvider.listItems(cart.id);
    if (items.length === 0) {
      throw new CheckoutError("CHECKOUT.EMPTY_CART", "Cart is empty.");
    }

    // 2. Validate address belongs to user
    const address = await this.addressProvider.findById(input.addressId);
    if (!address || address.userId !== context.userId || address.deletedAt) {
      throw new ResourceError("ADDRESS.NOT_FOUND", "Address not found.");
    }

    // 3. Calculate shipping
    const subtotalCents = items.reduce((sum, item) => {
      return sum + (item.unitPriceSnapshotCents + item.customizationPriceCents) * item.quantity;
    }, 0);

    const shippingResults = await this.shippingRuleProvider.calculateShipping({
      postalCode: address.postalCode,
      subtotalCents
    });

    const selectedShipping = shippingResults.find(
      (r) => r.method.id === input.shippingMethodId && r.method.isActive
    );

    if (!selectedShipping) {
      throw new CheckoutError("CHECKOUT.SHIPPING_UNAVAILABLE", "Selected shipping method is not available for this address.");
    }

    const shippingAmountCents = selectedShipping.rule.priceCents;

    // 4. Apply coupon if provided
    let couponId: string | null = null;
    let discountAmountCents = 0;

    if (input.couponCode) {
      const coupon = await this.couponProvider.findByCode(input.couponCode);
      if (coupon && coupon.status === "ACTIVE") {
        // Validate coupon
        const now = new Date();
        if (coupon.expiresAt && coupon.expiresAt < now) {
          throw new CheckoutError("CHECKOUT.COUPON_EXPIRED", "Coupon has expired.");
        }
        if (coupon.startsAt && coupon.startsAt > now) {
          throw new CheckoutError("CHECKOUT.COUPON_NOT_ACTIVE", "Coupon is not yet active.");
        }
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
          throw new CheckoutError("CHECKOUT.COUPON_MAX_USES", "Coupon has reached maximum uses.");
        }
        if (coupon.minimumOrderAmountCents !== null && subtotalCents < coupon.minimumOrderAmountCents) {
          throw new CheckoutError("CHECKOUT.MINIMUM_ORDER", "Order does not meet minimum amount for coupon.");
        }

        // Calculate discount
        if (coupon.type === "PERCENTAGE") {
          discountAmountCents = Math.floor(subtotalCents * coupon.valueCentsOrPercentage / 100);
        } else {
          discountAmountCents = coupon.valueCentsOrPercentage;
        }

        // Don't let discount exceed subtotal
        discountAmountCents = Math.min(discountAmountCents, subtotalCents);
        couponId = coupon.id;
      }
    }

    // 5. Calculate total
    const totalAmountCents = subtotalCents - discountAmountCents + shippingAmountCents;

    // 6. Create order
    const order = await this.orderProvider.create({
      userId: context.userId,
      status: "PENDING",
      currencyCode: "BRL",
      subtotalCents,
      discountAmountCents,
      shippingAmountCents,
      totalAmountCents,
      couponId,
      shippingMethodId: input.shippingMethodId,
      placedAt: new Date(),
      cancelledAt: null,
      paidAt: null
    });

    // 7. Create order address snapshot
    await this.orderProvider.createAddress({
      orderId: order.id,
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
      addressType: address.addressType
    });

    // 8. Create order items with product snapshots
    for (const cartItem of items) {
      const variant = await this.productVariantProvider.findById(cartItem.productVariantId);
      if (!variant) continue;

      const unitFinalPriceCents = (variant.promotionalPriceCents ?? variant.basePriceCents) + cartItem.customizationPriceCents;

      await this.orderProvider.createItem({
        orderId: order.id,
        productId: variant.productId,
        productVariantId: variant.id,
        productNameSnapshot: `Product ${variant.productId}`,
        productSlugSnapshot: variant.productId,
        skuSnapshot: variant.sku,
        categoryNameSnapshot: null,
        fabricNameSnapshot: variant.fabricId,
        sizeNameSnapshot: variant.sizeOptionId,
        colorNameSnapshot: variant.colorOptionId,
        quantity: cartItem.quantity,
        unitBasePriceCents: variant.basePriceCents,
        unitPromotionalPriceCents: variant.promotionalPriceCents,
        unitCustomizationPriceCents: cartItem.customizationPriceCents,
        unitFinalPriceCents,
        currencyCode: cartItem.currencyCode,
        customName: cartItem.customName,
        customNumber: cartItem.customNumber,
        customNotes: cartItem.customNotes
      });
    }

    // 9. Record coupon usage
    if (couponId) {
      await this.couponProvider.incrementUsage(couponId);
      await this.couponUsageProvider.create({
        couponId,
        userId: context.userId,
        orderId: order.id
      });
    }

    // 10. Convert cart
    await this.cartProvider.convertCart(cart.id);

    // 11. Update order to WAITING_PAYMENT
    const updatedOrder = await this.orderProvider.updateStatus(order.id, "WAITING_PAYMENT");
    await this.orderProvider.addStatusHistory({
      orderId: order.id,
      fromStatus: "PENDING",
      toStatus: "WAITING_PAYMENT",
      reason: "Checkout completed, awaiting payment",
      actorType: "USER",
      actorUserId: context.userId,
      traceId: context.traceId
    });

    // 12. Audit
    await this.auditProvider.emit({
      eventType: "CHECKOUT_COMPLETED",
      eventCategory: "CHECKOUT",
      actorType: "USER",
      actorUserId: context.userId,
      targetType: "ORDER",
      targetId: order.id,
      traceId: context.traceId,
      requestId: context.requestId,
      metadata: {
        totalAmountCents,
        itemCount: items.length,
        couponId,
        shippingMethodId: input.shippingMethodId
      },
      outcome: "SUCCESS"
    });

    return { order: updatedOrder, paymentAttemptId: "" };
  }
}

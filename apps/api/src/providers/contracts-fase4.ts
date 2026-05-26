// ═══════════════════════════════════════════════════════
// Fase 4 - Carrinho, Checkout e Pagamentos
// ═══════════════════════════════════════════════════════

// ── Record types ──────────────────────────────────────

export type CartRecord = {
  id: string;
  userId: string | null;
  guestTokenHash: string | null;
  status: "ACTIVE" | "MERGED" | "CONVERTED" | "EXPIRED" | "ABANDONED";
  expiresAt: Date | null;
  mergedIntoCartId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CartItemRecord = {
  id: string;
  cartId: string;
  productVariantId: string;
  quantity: number;
  unitPriceSnapshotCents: number;
  currencyCode: string;
  customName: string | null;
  customNumber: string | null;
  customNotes: string | null;
  customizationPriceCents: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CouponRecord = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  valueCentsOrPercentage: number;
  currencyCode: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "EXPIRED" | "ARCHIVED";
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
};

export type CouponUsageRecord = {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  usedAt: Date;
};

export type AddressRecord = {
  id: string;
  userId: string;
  label: string | null;
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
  addressType: "RESIDENTIAL" | "COMMERCIAL";
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type ShippingMethodRecord = {
  id: string;
  code: string;
  name: string;
  type: "STANDARD" | "EXPRESS" | "PICKUP";
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type ShippingRuleRecord = {
  id: string;
  shippingMethodId: string;
  postalCodeStart: string;
  postalCodeEnd: string;
  priceCents: number;
  currencyCode: string;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  minimumOrderAmountCents: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
};

export type OrderRecord = {
  id: string;
  userId: string;
  status: "PENDING" | "WAITING_PAYMENT" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" | "PAYMENT_FAILED";
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
};

export type OrderAddressRecord = {
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
  addressType: "RESIDENTIAL" | "COMMERCIAL";
  createdAt: Date;
};

export type OrderItemRecord = {
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
};

export type OrderStatusHistoryRecord = {
  id: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  actorType: string;
  actorUserId: string | null;
  traceId: string;
  createdAt: Date;
};

export type PaymentAttemptRecord = {
  id: string;
  orderId: string;
  provider: string;
  providerPaymentId: string | null;
  providerOrderId: string | null;
  idempotencyKey: string;
  method: "PIX" | "CREDIT_CARD" | "DEBIT_CARD";
  status: "CREATED" | "PENDING" | "PROCESSING" | "AUTHORIZED" | "APPROVED" | "REJECTED" | "CANCELLED" | "REFUNDED" | "CHARGEDBACK";
  amountCents: number;
  currencyCode: string;
  failureCode: string | null;
  failureMessage: string | null;
  expiresAt: Date | null;
  authorizedAt: Date | null;
  approvedAt: Date | null;
  cancelledAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentStatusTransitionRecord = {
  id: string;
  paymentAttemptId: string;
  fromStatus: string | null;
  toStatus: string;
  source: string;
  sourceReference: string | null;
  reason: string | null;
  traceId: string;
  createdAt: Date;
};

export type PaymentWebhookEventRecord = {
  id: string;
  paymentAttemptId: string | null;
  providerEventId: string | null;
  providerTopic: string | null;
  signatureValidated: boolean;
  rawBodyHash: string | null;
  receivedAt: Date;
  processedAt: Date | null;
  processingStatus: string;
  traceId: string;
};

export type FavoriteRecord = {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
};

// ── Provider interfaces ───────────────────────────────

export interface ICartProvider {
  findById(id: string): Promise<CartRecord | null>;
  findByUserId(userId: string): Promise<CartRecord[]>;
  findActiveByGuestToken(guestTokenHash: string): Promise<CartRecord | null>;
  findActiveByUserId(userId: string): Promise<CartRecord | null>;
  listItems(cartId: string): Promise<CartItemRecord[]>;
  create(input: Omit<CartRecord, "id" | "createdAt" | "updatedAt">): Promise<CartRecord>;
  addItem(cartId: string, input: Omit<CartItemRecord, "id" | "createdAt" | "updatedAt">): Promise<CartItemRecord>;
  updateItemQuantity(itemId: string, quantity: number): Promise<CartItemRecord>;
  removeItem(itemId: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  convertCart(cartId: string): Promise<CartRecord>;
  mergeGuestCart(guestTokenHash: string, userId: string): Promise<CartRecord>;
  updateStatus(cartId: string, status: CartRecord["status"]): Promise<CartRecord>;
}

export interface ICouponProvider {
  findById(id: string): Promise<CouponRecord | null>;
  findByCode(code: string): Promise<CouponRecord | null>;
  list(options: { status?: string; includeDeleted?: boolean }): Promise<CouponRecord[]>;
  create(input: Omit<CouponRecord, "id" | "createdAt" | "updatedAt" | "deletedAt" | "usedCount">): Promise<CouponRecord>;
  update(id: string, input: Partial<CouponRecord>): Promise<CouponRecord>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
  incrementUsage(id: string): Promise<void>;
}

export interface ICouponUsageProvider {
  create(input: Omit<CouponUsageRecord, "id" | "usedAt">): Promise<CouponUsageRecord>;
  findByCouponAndUser(couponId: string, userId: string): Promise<CouponUsageRecord[]>;
  countByCouponAndUser(couponId: string, userId: string): Promise<number>;
}

export interface IAddressProvider {
  findById(id: string): Promise<AddressRecord | null>;
  listByUserId(userId: string): Promise<AddressRecord[]>;
  create(input: Omit<AddressRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<AddressRecord>;
  update(id: string, input: Partial<AddressRecord>): Promise<AddressRecord>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
  setDefault(id: string, userId: string): Promise<void>;
}

export interface IShippingRuleProvider {
  findMethods(): Promise<ShippingMethodRecord[]>;
  findActiveRules(shippingMethodId: string): Promise<ShippingRuleRecord[]>;
  calculateShipping(input: {
    postalCode: string;
    subtotalCents: number;
  }): Promise<Array<{ method: ShippingMethodRecord; rule: ShippingRuleRecord }>>;
}

export interface IOrderProvider {
  findById(id: string): Promise<OrderRecord | null>;
  listByUserId(userId: string): Promise<OrderRecord[]>;
  list(options: {
    status?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: OrderRecord[]; total: number }>;
  create(input: Omit<OrderRecord, "id" | "createdAt" | "updatedAt">): Promise<OrderRecord>;
  createItem(input: Omit<OrderItemRecord, "id" | "createdAt">): Promise<OrderItemRecord>;
  createAddress(input: Omit<OrderAddressRecord, "id" | "createdAt">): Promise<OrderAddressRecord>;
  listItems(orderId: string): Promise<OrderItemRecord[]>;
  findAddressByOrderId(orderId: string): Promise<OrderAddressRecord | null>;
  updateStatus(id: string, status: OrderRecord["status"]): Promise<OrderRecord>;
  addStatusHistory(input: Omit<OrderStatusHistoryRecord, "id" | "createdAt">): Promise<OrderStatusHistoryRecord>;
}

export interface IPaymentAttemptProvider {
  findById(id: string): Promise<PaymentAttemptRecord | null>;
  findByOrderId(orderId: string): Promise<PaymentAttemptRecord[]>;
  findByIdempotencyKey(idempotencyKey: string): Promise<PaymentAttemptRecord | null>;
  create(input: Omit<PaymentAttemptRecord, "id" | "createdAt" | "updatedAt">): Promise<PaymentAttemptRecord>;
  updateStatus(
    id: string,
    status: PaymentAttemptRecord["status"],
    timestamps?: {
      authorizedAt?: Date;
      approvedAt?: Date;
      cancelledAt?: Date;
      refundedAt?: Date;
    }
  ): Promise<PaymentAttemptRecord>;
  addStatusTransition(input: Omit<PaymentStatusTransitionRecord, "id" | "createdAt">): Promise<PaymentStatusTransitionRecord>;
}

export interface IPaymentWebhookEventProvider {
  create(input: Omit<PaymentWebhookEventRecord, "id" | "receivedAt" | "processedAt">): Promise<PaymentWebhookEventRecord>;
  findByProviderEventId(providerEventId: string): Promise<PaymentWebhookEventRecord | null>;
  markProcessed(id: string, processedAt: Date): Promise<void>;
}

export interface IFavoriteProvider {
  findByUserAndProduct(userId: string, productId: string): Promise<FavoriteRecord | null>;
  listByUserId(userId: string): Promise<FavoriteRecord[]>;
  create(input: Omit<FavoriteRecord, "id" | "createdAt">): Promise<FavoriteRecord>;
  delete(userId: string, productId: string): Promise<void>;
}

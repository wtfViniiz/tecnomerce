import { ResourceError } from "@/core/errors/resource-error.js";
import { RequestError } from "@/core/errors/request-error.js";
import { CheckoutError } from "@/core/errors/checkout-error.js";
import type {
  CartRecord,
  CartItemRecord,
  ICartProvider
} from "@/providers/contracts-fase4.js";
import type { IAuditProvider, IProductVariantProvider } from "@/providers/contracts.js";
import type { AddItemInput, UpdateItemQuantityInput } from "@/modules/cart/schemas/cart.schema.js";
import { createHash, randomBytes } from "node:crypto";

type ServiceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
};

function hashGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type CartWithItems = {
  cart: CartRecord;
  items: CartItemRecord[];
};

export class CartService {
  public constructor(
    private readonly cartProvider: ICartProvider,
    private readonly productVariantProvider: IProductVariantProvider,
    private readonly auditProvider: IAuditProvider
  ) {}

  public async getOrCreateForUser(userId: string): Promise<CartRecord> {
    let cart = await this.cartProvider.findActiveByUserId(userId);
    if (!cart) {
      cart = await this.cartProvider.create({
        userId,
        guestTokenHash: null,
        status: "ACTIVE",
        expiresAt: null,
        mergedIntoCartId: null
      });
    }
    return cart;
  }

  public async getOrCreateForGuest(guestToken: string): Promise<CartRecord> {
    const tokenHash = hashGuestToken(guestToken);
    let cart = await this.cartProvider.findActiveByGuestToken(tokenHash);
    if (!cart) {
      cart = await this.cartProvider.create({
        userId: null,
        guestTokenHash: tokenHash,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        mergedIntoCartId: null
      });
    }
    return cart;
  }

  public async getActiveCart(userId?: string, guestToken?: string): Promise<CartRecord> {
    if (userId) {
      return this.getOrCreateForUser(userId);
    }
    if (guestToken) {
      return this.getOrCreateForGuest(guestToken);
    }
    throw new CheckoutError("CART.NO_IDENTIFIER", "User ID or guest token required.");
  }

  public async addItem(
    input: AddItemInput,
    userId?: string,
    guestToken?: string,
    context?: ServiceContext
  ): Promise<CartItemRecord> {
    const cart = await this.getActiveCart(userId, input.guestToken ?? guestToken);

    const variant = await this.productVariantProvider.findById(input.productVariantId);
    if (!variant || variant.deletedAt) {
      throw new ResourceError("PRODUCT_VARIANT.NOT_FOUND", "Product variant not found.");
    }
    if (!variant.isAvailable) {
      throw new CheckoutError("PRODUCT_VARIANT.UNAVAILABLE", "Product variant is not available.");
    }

    const unitPrice = variant.promotionalPriceCents ?? variant.basePriceCents;

    const item = await this.cartProvider.addItem(cart.id, {
      cartId: cart.id,
      productVariantId: input.productVariantId,
      quantity: input.quantity,
      unitPriceSnapshotCents: unitPrice,
      currencyCode: variant.currencyCode,
      customName: input.customName ?? null,
      customNumber: input.customNumber ?? null,
      customNotes: input.customNotes ?? null,
      customizationPriceCents: input.customizationPriceCents ?? 0
    });

    if (context) {
      await this.auditProvider.emit({
        eventType: "CART_ITEM_ADDED",
        eventCategory: "CART",
        actorType: userId ? "USER" : "SYSTEM",
        ...(context.userId !== undefined ? { actorUserId: context.userId } : {}),
        targetType: "CART",
        targetId: cart.id,
        traceId: context.traceId,
        requestId: context.requestId,
        metadata: { productVariantId: input.productVariantId, quantity: input.quantity },
        outcome: "SUCCESS"
      });
    }

    return item;
  }

  public async updateItemQuantity(
    itemId: string,
    input: UpdateItemQuantityInput,
    _context?: ServiceContext
  ): Promise<CartItemRecord> {
    return this.cartProvider.updateItemQuantity(itemId, input.quantity);
  }

  public async removeItem(itemId: string, context?: ServiceContext): Promise<void> {
    await this.cartProvider.removeItem(itemId);

    if (context) {
      await this.auditProvider.emit({
        eventType: "CART_ITEM_REMOVED",
        eventCategory: "CART",
        actorType: context.userId ? "USER" : "SYSTEM",
        ...(context.userId !== undefined ? { actorUserId: context.userId } : {}),
        targetType: "CART_ITEM",
        targetId: itemId,
        traceId: context.traceId,
        requestId: context.requestId,
        metadata: {},
        outcome: "SUCCESS"
      });
    }
  }

  public async clearCart(cartId: string, _context?: ServiceContext): Promise<void> {
    await this.cartProvider.clearCart(cartId);
  }

  public async mergeGuestCart(guestToken: string, userId: string, context?: ServiceContext): Promise<CartRecord> {
    const tokenHash = hashGuestToken(guestToken);
    const guestCart = await this.cartProvider.findActiveByGuestToken(tokenHash);
    if (!guestCart) {
      throw new ResourceError("CART.GUEST_NOT_FOUND", "Guest cart not found.");
    }

    const merged = await this.cartProvider.mergeGuestCart(tokenHash, userId);

    if (context) {
      await this.auditProvider.emit({
        eventType: "CART_MERGED",
        eventCategory: "CART",
        actorType: "USER",
        ...(context.userId !== undefined ? { actorUserId: context.userId } : {}),
        targetType: "CART",
        targetId: merged.id,
        traceId: context.traceId,
        requestId: context.requestId,
        metadata: { guestCartId: guestCart.id },
        outcome: "SUCCESS"
      });
    }

    return merged;
  }

  public async generateGuestToken(): Promise<string> {
    return randomBytes(32).toString("hex");
  }
}

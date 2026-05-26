import type { CartRecord, CartItemRecord, ICartProvider } from "@/providers/contracts-fase4.js";
import { prisma } from "@/providers/prisma.js";

const mapCart = (cart: {
  id: string;
  userId: string | null;
  guestTokenHash: string | null;
  status: string;
  expiresAt: Date | null;
  mergedIntoCartId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CartRecord => ({
  id: cart.id,
  userId: cart.userId,
  guestTokenHash: cart.guestTokenHash,
  status: cart.status as CartRecord["status"],
  expiresAt: cart.expiresAt,
  mergedIntoCartId: cart.mergedIntoCartId,
  createdAt: cart.createdAt,
  updatedAt: cart.updatedAt
});

const mapCartItem = (item: {
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
}): CartItemRecord => ({
  id: item.id,
  cartId: item.cartId,
  productVariantId: item.productVariantId,
  quantity: item.quantity,
  unitPriceSnapshotCents: item.unitPriceSnapshotCents,
  currencyCode: item.currencyCode,
  customName: item.customName,
  customNumber: item.customNumber,
  customNotes: item.customNotes,
  customizationPriceCents: item.customizationPriceCents,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
});

export class PrismaCartProvider implements ICartProvider {
  public async findById(id: string): Promise<CartRecord | null> {
    const cart = await prisma.cart.findUnique({ where: { id } });
    return cart ? mapCart(cart) : null;
  }

  public async findByUserId(userId: string): Promise<CartRecord[]> {
    const carts = await prisma.cart.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    return carts.map(mapCart);
  }

  public async findActiveByGuestToken(guestTokenHash: string): Promise<CartRecord | null> {
    const cart = await prisma.cart.findFirst({
      where: { guestTokenHash, status: "ACTIVE" }
    });
    return cart ? mapCart(cart) : null;
  }

  public async findActiveByUserId(userId: string): Promise<CartRecord | null> {
    const cart = await prisma.cart.findFirst({
      where: { userId, status: "ACTIVE" }
    });
    return cart ? mapCart(cart) : null;
  }

  public async create(
    input: Omit<CartRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<CartRecord> {
    const cart = await prisma.cart.create({
      data: {
        userId: input.userId,
        guestTokenHash: input.guestTokenHash,
        status: input.status,
        expiresAt: input.expiresAt,
        mergedIntoCartId: input.mergedIntoCartId
      }
    });
    return mapCart(cart);
  }

  public async addItem(
    cartId: string,
    input: Omit<CartItemRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<CartItemRecord> {
    const item = await prisma.cartItem.create({
      data: {
        cartId,
        productVariantId: input.productVariantId,
        quantity: input.quantity,
        unitPriceSnapshotCents: input.unitPriceSnapshotCents,
        currencyCode: input.currencyCode,
        customName: input.customName,
        customNumber: input.customNumber,
        customNotes: input.customNotes,
        customizationPriceCents: input.customizationPriceCents
      }
    });
    return mapCartItem(item);
  }

  public async updateItemQuantity(itemId: string, quantity: number): Promise<CartItemRecord> {
    const item = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });
    return mapCartItem(item);
  }

  public async removeItem(itemId: string): Promise<void> {
    await prisma.cartItem.delete({ where: { id: itemId } });
  }

  public async clearCart(cartId: string): Promise<void> {
    await prisma.cartItem.deleteMany({ where: { cartId } });
  }

  public async convertCart(cartId: string): Promise<CartRecord> {
    const cart = await prisma.cart.update({
      where: { id: cartId },
      data: { status: "CONVERTED" }
    });
    return mapCart(cart);
  }

  public async mergeGuestCart(guestTokenHash: string, userId: string): Promise<CartRecord> {
    const guestCart = await prisma.cart.findFirst({
      where: { guestTokenHash, status: "ACTIVE" }
    });

    if (!guestCart) {
      throw new Error("Guest cart not found");
    }

    let userCart = await prisma.cart.findFirst({
      where: { userId, status: "ACTIVE" }
    });

    if (!userCart) {
      userCart = await prisma.cart.create({
        data: { userId, status: "ACTIVE" }
      });
    }

    // Move items from guest cart to user cart
    await prisma.cartItem.updateMany({
      where: { cartId: guestCart.id },
      data: { cartId: userCart.id }
    });

    // Mark guest cart as merged
    await prisma.cart.update({
      where: { id: guestCart.id },
      data: { status: "MERGED", mergedIntoCartId: userCart.id }
    });

    return mapCart(userCart);
  }

  public async updateStatus(cartId: string, status: CartRecord["status"]): Promise<CartRecord> {
    const cart = await prisma.cart.update({
      where: { id: cartId },
      data: { status }
    });
    return mapCart(cart);
  }
}

import type { ProductVariantRecord, IProductVariantProvider } from "@/providers/contracts.js";
import { prisma } from "@/providers/prisma.js";

const mapProductVariant = (variant: {
  id: string;
  productId: string;
  sku: string;
  fabricId: string;
  sizeOptionId: string;
  colorOptionId: string;
  basePriceCents: number;
  promotionalPriceCents: number | null;
  currencyCode: string;
  status: string;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}): ProductVariantRecord => ({
  id: variant.id,
  productId: variant.productId,
  sku: variant.sku,
  fabricId: variant.fabricId,
  sizeOptionId: variant.sizeOptionId,
  colorOptionId: variant.colorOptionId,
  basePriceCents: variant.basePriceCents,
  promotionalPriceCents: variant.promotionalPriceCents,
  currencyCode: variant.currencyCode,
  status: variant.status,
  isAvailable: variant.isAvailable,
  sortOrder: variant.sortOrder,
  createdAt: variant.createdAt,
  updatedAt: variant.updatedAt,
  deletedAt: variant.deletedAt,
  createdByUserId: variant.createdByUserId,
  updatedByUserId: variant.updatedByUserId
});

export class PrismaProductVariantProvider implements IProductVariantProvider {
  public async findById(id: string): Promise<ProductVariantRecord | null> {
    const variant = await prisma.productVariant.findUnique({ where: { id } });
    return variant ? mapProductVariant(variant) : null;
  }

  public async listByProductId(productId: string): Promise<ProductVariantRecord[]> {
    const variants = await prisma.productVariant.findMany({
      where: { productId, deletedAt: null },
      orderBy: { sortOrder: "asc" }
    });

    return variants.map(mapProductVariant);
  }

  public async create(
    input: Omit<ProductVariantRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<ProductVariantRecord> {
    const variant = await prisma.productVariant.create({
      data: {
        productId: input.productId,
        sku: input.sku,
        fabricId: input.fabricId,
        sizeOptionId: input.sizeOptionId,
        colorOptionId: input.colorOptionId,
        basePriceCents: input.basePriceCents,
        promotionalPriceCents: input.promotionalPriceCents,
        currencyCode: input.currencyCode,
        status: input.status,
        isAvailable: input.isAvailable,
        sortOrder: input.sortOrder,
        createdByUserId: input.createdByUserId,
        updatedByUserId: input.updatedByUserId
      }
    });

    return mapProductVariant(variant);
  }

  public async update(id: string, input: Partial<ProductVariantRecord>): Promise<ProductVariantRecord> {
    const data: Record<string, unknown> = {};

    if (input.sku !== undefined) data.sku = input.sku;
    if (input.fabricId !== undefined) data.fabricId = input.fabricId;
    if (input.sizeOptionId !== undefined) data.sizeOptionId = input.sizeOptionId;
    if (input.colorOptionId !== undefined) data.colorOptionId = input.colorOptionId;
    if (input.basePriceCents !== undefined) data.basePriceCents = input.basePriceCents;
    if (input.promotionalPriceCents !== undefined) data.promotionalPriceCents = input.promotionalPriceCents;
    if (input.currencyCode !== undefined) data.currencyCode = input.currencyCode;
    if (input.status !== undefined) data.status = input.status;
    if (input.isAvailable !== undefined) data.isAvailable = input.isAvailable;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
    if (input.updatedByUserId !== undefined) data.updatedByUserId = input.updatedByUserId;

    const variant = await prisma.productVariant.update({
      where: { id },
      data
    });

    return mapProductVariant(variant);
  }

  public async softDelete(id: string, deletedAt: Date): Promise<void> {
    await prisma.productVariant.update({
      where: { id },
      data: { deletedAt }
    });
  }
}

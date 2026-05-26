import type { ProductRecord, IProductProvider } from "@/providers/contracts.js";
import { prisma } from "@/providers/prisma.js";

const mapProduct = (product: {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  status: string;
  isCustomizable: boolean;
  couponEligible: boolean;
  productionTimeDays: number;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}): ProductRecord => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  description: product.description,
  categoryId: product.categoryId,
  status: product.status as ProductRecord["status"],
  isCustomizable: product.isCustomizable,
  couponEligible: product.couponEligible,
  productionTimeDays: product.productionTimeDays,
  seoTitle: product.seoTitle,
  seoDescription: product.seoDescription,
  publishedAt: product.publishedAt,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
  deletedAt: product.deletedAt,
  createdByUserId: product.createdByUserId,
  updatedByUserId: product.updatedByUserId
});

export class PrismaProductProvider implements IProductProvider {
  public async findById(id: string): Promise<ProductRecord | null> {
    const product = await prisma.product.findUnique({ where: { id } });
    return product ? mapProduct(product) : null;
  }

  public async findBySlug(slug: string): Promise<ProductRecord | null> {
    const product = await prisma.product.findUnique({ where: { slug } });
    return product ? mapProduct(product) : null;
  }

  public async list(options: {
    status?: string;
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
  }): Promise<{ items: ProductRecord[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (!options.includeDeleted) {
      where.deletedAt = null;
    }

    if (options.status) {
      where.status = options.status;
    }

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options.search) {
      where.name = { contains: options.search, mode: "insensitive" };
    }

    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset
      }),
      prisma.product.count({ where })
    ]);

    return { items: items.map(mapProduct), total };
  }

  public async create(
    input: Omit<ProductRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<ProductRecord> {
    const product = await prisma.product.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        status: input.status,
        isCustomizable: input.isCustomizable,
        couponEligible: input.couponEligible,
        productionTimeDays: input.productionTimeDays,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        publishedAt: input.publishedAt,
        createdByUserId: input.createdByUserId,
        updatedByUserId: input.updatedByUserId
      }
    });

    return mapProduct(product);
  }

  public async update(id: string, input: Partial<ProductRecord>): Promise<ProductRecord> {
    const data: Record<string, unknown> = {};

    if (input.slug !== undefined) data.slug = input.slug;
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.status !== undefined) data.status = input.status;
    if (input.isCustomizable !== undefined) data.isCustomizable = input.isCustomizable;
    if (input.couponEligible !== undefined) data.couponEligible = input.couponEligible;
    if (input.productionTimeDays !== undefined) data.productionTimeDays = input.productionTimeDays;
    if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) data.seoDescription = input.seoDescription;
    if (input.publishedAt !== undefined) data.publishedAt = input.publishedAt;
    if (input.updatedByUserId !== undefined) data.updatedByUserId = input.updatedByUserId;

    const product = await prisma.product.update({
      where: { id },
      data
    });

    return mapProduct(product);
  }

  public async softDelete(id: string, deletedAt: Date): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { deletedAt }
    });
  }
}

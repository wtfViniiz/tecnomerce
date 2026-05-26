import type { CategoryRecord, ICategoryProvider } from "@/providers/contracts.js";
import { prisma } from "@/providers/prisma.js";

const mapCategory = (category: {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}): CategoryRecord => ({
  id: category.id,
  slug: category.slug,
  name: category.name,
  description: category.description,
  sortOrder: category.sortOrder,
  status: category.status,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
  deletedAt: category.deletedAt,
  createdByUserId: category.createdByUserId,
  updatedByUserId: category.updatedByUserId
});

export class PrismaCategoryProvider implements ICategoryProvider {
  public async findById(id: string): Promise<CategoryRecord | null> {
    const category = await prisma.category.findUnique({ where: { id } });
    return category ? mapCategory(category) : null;
  }

  public async findBySlug(slug: string): Promise<CategoryRecord | null> {
    const category = await prisma.category.findUnique({ where: { slug } });
    return category ? mapCategory(category) : null;
  }

  public async list(options: { status?: string; includeDeleted?: boolean }): Promise<CategoryRecord[]> {
    const where: Record<string, unknown> = {};

    if (!options.includeDeleted) {
      where.deletedAt = null;
    }

    if (options.status) {
      where.status = options.status;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: "asc" }
    });

    return categories.map(mapCategory);
  }

  public async create(
    input: Omit<CategoryRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<CategoryRecord> {
    const category = await prisma.category.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        sortOrder: input.sortOrder,
        status: input.status,
        createdByUserId: input.createdByUserId,
        updatedByUserId: input.updatedByUserId
      }
    });

    return mapCategory(category);
  }

  public async update(id: string, input: Partial<CategoryRecord>): Promise<CategoryRecord> {
    const data: Record<string, unknown> = {};

    if (input.slug !== undefined) data.slug = input.slug;
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
    if (input.status !== undefined) data.status = input.status;
    if (input.updatedByUserId !== undefined) data.updatedByUserId = input.updatedByUserId;

    const category = await prisma.category.update({
      where: { id },
      data
    });

    return mapCategory(category);
  }

  public async softDelete(id: string, deletedAt: Date): Promise<void> {
    await prisma.category.update({
      where: { id },
      data: { deletedAt }
    });
  }
}

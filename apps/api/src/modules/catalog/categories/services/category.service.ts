import { ResourceError } from "@/core/errors/resource-error.js";
import { RequestError } from "@/core/errors/request-error.js";
import type {
  CategoryRecord,
  IAuditProvider,
  ICategoryProvider,
  IPublicCacheProvider
} from "@/providers/contracts.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/modules/catalog/categories/schemas/category.schema.js";

const CACHE_KEY_CATEGORIES_LIST = "public:categories:list";
const CACHE_TTL_SECONDS = 300;

type ServiceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
};

export class CategoryService {
  public constructor(
    private readonly categoryProvider: ICategoryProvider,
    private readonly cacheProvider: IPublicCacheProvider,
    private readonly auditProvider: IAuditProvider
  ) {}

  public async list(): Promise<CategoryRecord[]> {
    const cached = await this.cacheProvider.get<CategoryRecord[]>(CACHE_KEY_CATEGORIES_LIST);
    if (cached) {
      return cached;
    }

    const categories = await this.categoryProvider.list({ status: "ACTIVE" });
    await this.cacheProvider.set(CACHE_KEY_CATEGORIES_LIST, categories, CACHE_TTL_SECONDS);
    return categories;
  }

  public async listAll(): Promise<CategoryRecord[]> {
    return this.categoryProvider.list({ includeDeleted: false });
  }

  public async getBySlug(slug: string): Promise<CategoryRecord> {
    const cacheKey = `public:categories:slug:${slug}`;
    const cached = await this.cacheProvider.get<CategoryRecord>(cacheKey);
    if (cached) {
      return cached;
    }

    const category = await this.categoryProvider.findBySlug(slug);
    if (!category || category.deletedAt) {
      throw new ResourceError("CATEGORY.NOT_FOUND", "Category not found.");
    }

    await this.cacheProvider.set(cacheKey, category, CACHE_TTL_SECONDS);
    return category;
  }

  public async create(input: CreateCategoryInput, context: ServiceContext): Promise<CategoryRecord> {
    const slug = this.slugify(input.name);

    const existing = await this.categoryProvider.findBySlug(slug);
    if (existing) {
      throw new RequestError("CATEGORY.SLUG_EXISTS", "A category with this name already exists.");
    }

    const category = await this.categoryProvider.create({
      slug,
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder ?? 0,
      status: "ACTIVE",
      createdByUserId: context.userId ?? null,
      updatedByUserId: context.userId ?? null
    });

    await this.invalidateCache();

    await this.auditProvider.emit({
      eventType: "CATEGORY_CREATED",
      eventCategory: "CATALOG",
      actorType: context.userId ? "ADMIN" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "CATEGORY",
      targetId: category.id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });

    return category;
  }

  public async update(id: string, input: UpdateCategoryInput, context: ServiceContext): Promise<CategoryRecord> {
    const existing = await this.categoryProvider.findById(id);
    if (!existing || existing.deletedAt) {
      throw new ResourceError("CATEGORY.NOT_FOUND", "Category not found.");
    }

    const updateData: Partial<CategoryRecord> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
      updateData.slug = this.slugify(input.name);
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.sortOrder !== undefined) {
      updateData.sortOrder = input.sortOrder;
    }

    updateData.updatedByUserId = context.userId ?? null;

    const category = await this.categoryProvider.update(id, updateData);
    await this.invalidateCache();

    await this.auditProvider.emit({
      eventType: "CATEGORY_UPDATED",
      eventCategory: "CATALOG",
      actorType: context.userId ? "ADMIN" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "CATEGORY",
      targetId: category.id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });

    return category;
  }

  public async softDelete(id: string, context: ServiceContext): Promise<void> {
    const existing = await this.categoryProvider.findById(id);
    if (!existing || existing.deletedAt) {
      throw new ResourceError("CATEGORY.NOT_FOUND", "Category not found.");
    }

    await this.categoryProvider.softDelete(id, new Date());
    await this.invalidateCache();

    await this.auditProvider.emit({
      eventType: "CATEGORY_DELETED",
      eventCategory: "CATALOG",
      actorType: context.userId ? "ADMIN" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "CATEGORY",
      targetId: id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });
  }

  private async invalidateCache(): Promise<void> {
    await this.cacheProvider.invalidatePattern("public:categories:*");
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
}

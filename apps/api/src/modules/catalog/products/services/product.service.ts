import { ResourceError } from "@/core/errors/resource-error.js";
import { RequestError } from "@/core/errors/request-error.js";
import type {
  ProductRecord,
  ProductVariantRecord,
  IAuditProvider,
  ICategoryProvider,
  IProductProvider,
  IProductVariantProvider,
  IPublicCacheProvider
} from "@/providers/contracts.js";
import type { CreateProductInput, UpdateProductInput, ProductListQuery } from "@/modules/catalog/products/schemas/product.schema.js";

const CACHE_KEY_PRODUCTS_LIST = "public:products:list";
const CACHE_TTL_SECONDS = 300;

type ServiceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
};

type ProductWithVariants = ProductRecord & {
  variants: ProductVariantRecord[];
};

export class ProductService {
  public constructor(
    private readonly productProvider: IProductProvider,
    private readonly variantProvider: IProductVariantProvider,
    private readonly categoryProvider: ICategoryProvider,
    private readonly cacheProvider: IPublicCacheProvider,
    private readonly auditProvider: IAuditProvider
  ) {}

  public async list(query: ProductListQuery): Promise<{ items: ProductRecord[]; total: number }> {
    return this.productProvider.list({
      ...(query.status !== undefined && { status: query.status }),
      ...(query.categoryId !== undefined && { categoryId: query.categoryId }),
      ...(query.search !== undefined && { search: query.search }),
      limit: query.limit ?? 20,
      offset: query.offset ?? 0
    });
  }

  public async listPublished(query: ProductListQuery): Promise<{ items: ProductRecord[]; total: number }> {
    const cacheKey = `public:products:list:${JSON.stringify(query)}`;
    const cached = await this.cacheProvider.get<{ items: ProductRecord[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.productProvider.list({
      status: "PUBLISHED",
      ...(query.categoryId !== undefined && { categoryId: query.categoryId }),
      ...(query.search !== undefined && { search: query.search }),
      limit: query.limit ?? 20,
      offset: query.offset ?? 0
    });

    await this.cacheProvider.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  }

  public async getBySlug(slug: string): Promise<ProductWithVariants> {
    const cacheKey = `public:products:slug:${slug}`;
    const cached = await this.cacheProvider.get<ProductWithVariants>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.productProvider.findBySlug(slug);
    if (!product || product.deletedAt) {
      throw new ResourceError("PRODUCT.NOT_FOUND", "Product not found.");
    }

    const variants = await this.variantProvider.listByProductId(product.id);
    const result: ProductWithVariants = { ...product, variants };

    await this.cacheProvider.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  }

  public async getById(id: string): Promise<ProductWithVariants> {
    const product = await this.productProvider.findById(id);
    if (!product || product.deletedAt) {
      throw new ResourceError("PRODUCT.NOT_FOUND", "Product not found.");
    }

    const variants = await this.variantProvider.listByProductId(product.id);
    return { ...product, variants };
  }

  public async create(input: CreateProductInput, context: ServiceContext): Promise<ProductWithVariants> {
    const category = await this.categoryProvider.findById(input.categoryId);
    if (!category || category.deletedAt) {
      throw new RequestError("PRODUCT.INVALID_CATEGORY", "Category not found.");
    }

    const slug = this.slugify(input.name);
    const existing = await this.productProvider.findBySlug(slug);
    if (existing) {
      throw new RequestError("PRODUCT.SLUG_EXISTS", "A product with this name already exists.");
    }

    const product = await this.productProvider.create({
      slug,
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      status: "DRAFT",
      isCustomizable: input.isCustomizable ?? false,
      couponEligible: input.couponEligible ?? true,
      productionTimeDays: input.productionTimeDays ?? 0,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      publishedAt: null,
      createdByUserId: context.userId ?? null,
      updatedByUserId: context.userId ?? null
    });

    const variants: ProductVariantRecord[] = [];
    for (const variantInput of input.variants) {
      const variant = await this.variantProvider.create({
        productId: product.id,
        sku: variantInput.sku,
        fabricId: variantInput.fabricId,
        sizeOptionId: variantInput.sizeOptionId,
        colorOptionId: variantInput.colorOptionId,
        basePriceCents: variantInput.basePriceCents,
        promotionalPriceCents: variantInput.promotionalPriceCents ?? null,
        currencyCode: "BRL",
        status: "ACTIVE",
        isAvailable: true,
        sortOrder: 0,
        createdByUserId: context.userId ?? null,
        updatedByUserId: context.userId ?? null
      });
      variants.push(variant);
    }

    await this.invalidateCache();

    await this.auditProvider.emit({
      eventType: "PRODUCT_CREATED",
      eventCategory: "CATALOG",
      actorType: context.userId ? "ADMIN" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "PRODUCT",
      targetId: product.id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });

    return { ...product, variants };
  }

  public async update(id: string, input: UpdateProductInput, context: ServiceContext): Promise<ProductRecord> {
    const existing = await this.productProvider.findById(id);
    if (!existing || existing.deletedAt) {
      throw new ResourceError("PRODUCT.NOT_FOUND", "Product not found.");
    }

    const updateData: Partial<ProductRecord> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
      updateData.slug = this.slugify(input.name);
    }

    if (input.description !== undefined) updateData.description = input.description;
    if (input.categoryId !== undefined) {
      const category = await this.categoryProvider.findById(input.categoryId);
      if (!category || category.deletedAt) {
        throw new RequestError("PRODUCT.INVALID_CATEGORY", "Category not found.");
      }
      updateData.categoryId = input.categoryId;
    }
    if (input.isCustomizable !== undefined) updateData.isCustomizable = input.isCustomizable;
    if (input.couponEligible !== undefined) updateData.couponEligible = input.couponEligible;
    if (input.productionTimeDays !== undefined) updateData.productionTimeDays = input.productionTimeDays;
    if (input.seoTitle !== undefined) updateData.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) updateData.seoDescription = input.seoDescription;

    updateData.updatedByUserId = context.userId ?? null;

    const product = await this.productProvider.update(id, updateData);
    await this.invalidateCache();

    await this.auditProvider.emit({
      eventType: "PRODUCT_UPDATED",
      eventCategory: "CATALOG",
      actorType: context.userId ? "ADMIN" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "PRODUCT",
      targetId: product.id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });

    return product;
  }

  public async publish(id: string, context: ServiceContext): Promise<ProductRecord> {
    const product = await this.productProvider.findById(id);
    if (!product || product.deletedAt) {
      throw new ResourceError("PRODUCT.NOT_FOUND", "Product not found.");
    }

    const variants = await this.variantProvider.listByProductId(id);
    const activeVariants = variants.filter((v) => !v.deletedAt && v.isAvailable);
    const hasVariantWithSku = activeVariants.some((v) => v.sku.length > 0);

    if (activeVariants.length === 0 || !hasVariantWithSku) {
      throw new RequestError(
        "PRODUCT.MISSING_VARIANTS",
        "A published product must have at least one active variant with a SKU."
      );
    }

    const updated = await this.productProvider.update(id, {
      status: "PUBLISHED",
      publishedAt: new Date(),
      updatedByUserId: context.userId ?? null
    });

    await this.invalidateCache();

    await this.auditProvider.emit({
      eventType: "PRODUCT_PUBLISHED",
      eventCategory: "CATALOG",
      actorType: "ADMIN",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "PRODUCT",
      targetId: id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });

    return updated;
  }

  public async archive(id: string, context: ServiceContext): Promise<ProductRecord> {
    const product = await this.productProvider.findById(id);
    if (!product || product.deletedAt) {
      throw new ResourceError("PRODUCT.NOT_FOUND", "Product not found.");
    }

    const updated = await this.productProvider.update(id, {
      status: "ARCHIVED",
      updatedByUserId: context.userId ?? null
    });

    await this.invalidateCache();

    await this.auditProvider.emit({
      eventType: "PRODUCT_ARCHIVED",
      eventCategory: "CATALOG",
      actorType: "ADMIN",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "PRODUCT",
      targetId: id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });

    return updated;
  }

  public async softDelete(id: string, context: ServiceContext): Promise<void> {
    const existing = await this.productProvider.findById(id);
    if (!existing || existing.deletedAt) {
      throw new ResourceError("PRODUCT.NOT_FOUND", "Product not found.");
    }

    await this.productProvider.softDelete(id, new Date());
    await this.invalidateCache();

    await this.auditProvider.emit({
      eventType: "PRODUCT_DELETED",
      eventCategory: "CATALOG",
      actorType: context.userId ? "ADMIN" : "SYSTEM",
      ...(context.userId !== undefined && { actorUserId: context.userId }),
      targetType: "PRODUCT",
      targetId: id,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });
  }

  private async invalidateCache(): Promise<void> {
    await this.cacheProvider.invalidatePattern("public:products:*");
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

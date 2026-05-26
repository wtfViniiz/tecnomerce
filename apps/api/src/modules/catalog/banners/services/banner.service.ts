import { ResourceError } from "@/core/errors/resource-error.js";
import type {
  BannerRecord,
  IBannerProvider,
  IPublicCacheProvider
} from "@/providers/contracts.js";
import type { CreateBannerInput, UpdateBannerInput } from "@/modules/catalog/banners/schemas/banner.schema.js";

const CACHE_KEY_BANNERS_ACTIVE = "public:banners:active";
const CACHE_KEY_BANNERS_LIST = "admin:banners:list";
const CACHE_TTL_SECONDS = 300;

type ServiceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
};

export class BannerService {
  public constructor(
    private readonly bannerProvider: IBannerProvider,
    private readonly cacheProvider: IPublicCacheProvider
  ) {}

  public async listActive(): Promise<BannerRecord[]> {
    const cached = await this.cacheProvider.get<BannerRecord[]>(CACHE_KEY_BANNERS_ACTIVE);
    if (cached) {
      return cached;
    }

    const banners = await this.bannerProvider.listActive();
    await this.cacheProvider.set(CACHE_KEY_BANNERS_ACTIVE, banners, CACHE_TTL_SECONDS);
    return banners;
  }

  public async listAll(): Promise<BannerRecord[]> {
    return this.bannerProvider.list({ includeDeleted: false });
  }

  public async getById(id: string): Promise<BannerRecord> {
    const banner = await this.bannerProvider.findById(id);
    if (!banner || banner.deletedAt) {
      throw new ResourceError("BANNER.NOT_FOUND", "Banner not found.");
    }
    return banner;
  }

  public async create(input: CreateBannerInput, context: ServiceContext): Promise<BannerRecord> {
    const slug = this.slugify(input.title);

    const banner = await this.bannerProvider.create({
      slug,
      title: input.title,
      subtitle: input.subtitle ?? null,
      ctaLabel: input.ctaLabel ?? null,
      ctaHref: input.ctaHref ?? null,
      desktopMediaKey: input.desktopMediaKey ?? null,
      mobileMediaKey: input.mobileMediaKey ?? null,
      status: input.status ?? "DRAFT",
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      sortOrder: input.sortOrder ?? 0,
      createdByUserId: context.userId ?? null,
      updatedByUserId: context.userId ?? null
    });

    await this.invalidateCache();
    return banner;
  }

  public async update(id: string, input: UpdateBannerInput, context: ServiceContext): Promise<BannerRecord> {
    const existing = await this.bannerProvider.findById(id);
    if (!existing || existing.deletedAt) {
      throw new ResourceError("BANNER.NOT_FOUND", "Banner not found.");
    }

    const updateData: Partial<BannerRecord> = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
      updateData.slug = this.slugify(input.title);
    }

    if (input.subtitle !== undefined) updateData.subtitle = input.subtitle;
    if (input.ctaLabel !== undefined) updateData.ctaLabel = input.ctaLabel;
    if (input.ctaHref !== undefined) updateData.ctaHref = input.ctaHref;
    if (input.desktopMediaKey !== undefined) updateData.desktopMediaKey = input.desktopMediaKey;
    if (input.mobileMediaKey !== undefined) updateData.mobileMediaKey = input.mobileMediaKey;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.startsAt !== undefined) updateData.startsAt = input.startsAt;
    if (input.endsAt !== undefined) updateData.endsAt = input.endsAt;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

    updateData.updatedByUserId = context.userId ?? null;

    const banner = await this.bannerProvider.update(id, updateData);
    await this.invalidateCache();
    return banner;
  }

  public async softDelete(id: string, context: ServiceContext): Promise<void> {
    const existing = await this.bannerProvider.findById(id);
    if (!existing || existing.deletedAt) {
      throw new ResourceError("BANNER.NOT_FOUND", "Banner not found.");
    }

    await this.bannerProvider.softDelete(id, new Date());
    await this.invalidateCache();
  }

  private async invalidateCache(): Promise<void> {
    await this.cacheProvider.invalidatePattern("public:banners:*");
    await this.cacheProvider.invalidatePattern("admin:banners:*");
  }

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
}

import type { BannerRecord, IBannerProvider } from "@/providers/contracts.js";
import { prisma } from "@/providers/prisma.js";

const mapBanner = (banner: {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  desktopMediaKey: string | null;
  mobileMediaKey: string | null;
  status: string;
  startsAt: Date | null;
  endsAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}): BannerRecord => ({
  id: banner.id,
  slug: banner.slug,
  title: banner.title,
  subtitle: banner.subtitle,
  ctaLabel: banner.ctaLabel,
  ctaHref: banner.ctaHref,
  desktopMediaKey: banner.desktopMediaKey,
  mobileMediaKey: banner.mobileMediaKey,
  status: banner.status as BannerRecord["status"],
  startsAt: banner.startsAt,
  endsAt: banner.endsAt,
  sortOrder: banner.sortOrder,
  createdAt: banner.createdAt,
  updatedAt: banner.updatedAt,
  deletedAt: banner.deletedAt,
  createdByUserId: banner.createdByUserId,
  updatedByUserId: banner.updatedByUserId
});

export class PrismaBannerProvider implements IBannerProvider {
  public async findById(id: string): Promise<BannerRecord | null> {
    const banner = await prisma.banner.findUnique({ where: { id } });
    return banner ? mapBanner(banner) : null;
  }

  public async list(options: { status?: string; includeDeleted?: boolean }): Promise<BannerRecord[]> {
    const where: Record<string, unknown> = {};

    if (!options.includeDeleted) {
      where.deletedAt = null;
    }

    if (options.status) {
      where.status = options.status;
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { sortOrder: "asc" }
    });

    return banners.map(mapBanner);
  }

  public async listActive(): Promise<BannerRecord[]> {
    const now = new Date();

    const banners = await prisma.banner.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: now } }
            ]
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { sortOrder: "asc" }
    });

    return banners.map(mapBanner);
  }

  public async create(
    input: Omit<BannerRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<BannerRecord> {
    const banner = await prisma.banner.create({
      data: {
        slug: input.slug,
        title: input.title,
        subtitle: input.subtitle,
        ctaLabel: input.ctaLabel,
        ctaHref: input.ctaHref,
        desktopMediaKey: input.desktopMediaKey,
        mobileMediaKey: input.mobileMediaKey,
        status: input.status,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        sortOrder: input.sortOrder,
        createdByUserId: input.createdByUserId,
        updatedByUserId: input.updatedByUserId
      }
    });

    return mapBanner(banner);
  }

  public async update(id: string, input: Partial<BannerRecord>): Promise<BannerRecord> {
    const data: Record<string, unknown> = {};

    if (input.slug !== undefined) data.slug = input.slug;
    if (input.title !== undefined) data.title = input.title;
    if (input.subtitle !== undefined) data.subtitle = input.subtitle;
    if (input.ctaLabel !== undefined) data.ctaLabel = input.ctaLabel;
    if (input.ctaHref !== undefined) data.ctaHref = input.ctaHref;
    if (input.desktopMediaKey !== undefined) data.desktopMediaKey = input.desktopMediaKey;
    if (input.mobileMediaKey !== undefined) data.mobileMediaKey = input.mobileMediaKey;
    if (input.status !== undefined) data.status = input.status;
    if (input.startsAt !== undefined) data.startsAt = input.startsAt;
    if (input.endsAt !== undefined) data.endsAt = input.endsAt;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
    if (input.updatedByUserId !== undefined) data.updatedByUserId = input.updatedByUserId;

    const banner = await prisma.banner.update({
      where: { id },
      data
    });

    return mapBanner(banner);
  }

  public async softDelete(id: string, deletedAt: Date): Promise<void> {
    await prisma.banner.update({
      where: { id },
      data: { deletedAt }
    });
  }
}

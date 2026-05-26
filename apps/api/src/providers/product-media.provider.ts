import type { ProductMediaRecord, IProductMediaProvider } from "@/providers/contracts.js";
import { prisma } from "@/providers/prisma.js";

const mapProductMedia = (media: {
  id: string;
  productId: string;
  storageKey: string;
  cdnUrl: string;
  altText: string | null;
  mediaType: string;
  position: number;
  isPrimary: boolean;
  width: number | null;
  height: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
}): ProductMediaRecord => ({
  id: media.id,
  productId: media.productId,
  storageKey: media.storageKey,
  cdnUrl: media.cdnUrl,
  altText: media.altText,
  mediaType: media.mediaType as ProductMediaRecord["mediaType"],
  position: media.position,
  isPrimary: media.isPrimary,
  width: media.width,
  height: media.height,
  createdAt: media.createdAt,
  updatedAt: media.updatedAt,
  deletedAt: media.deletedAt,
  createdByUserId: media.createdByUserId
});

export class PrismaProductMediaProvider implements IProductMediaProvider {
  public async findById(id: string): Promise<ProductMediaRecord | null> {
    const media = await prisma.productMedia.findUnique({ where: { id } });
    return media ? mapProductMedia(media) : null;
  }

  public async listByProductId(productId: string): Promise<ProductMediaRecord[]> {
    const media = await prisma.productMedia.findMany({
      where: { productId, deletedAt: null },
      orderBy: { position: "asc" }
    });

    return media.map(mapProductMedia);
  }

  public async create(
    input: Omit<ProductMediaRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">
  ): Promise<ProductMediaRecord> {
    const media = await prisma.productMedia.create({
      data: {
        productId: input.productId,
        storageKey: input.storageKey,
        cdnUrl: input.cdnUrl,
        altText: input.altText,
        mediaType: input.mediaType,
        position: input.position,
        isPrimary: input.isPrimary,
        width: input.width,
        height: input.height,
        createdByUserId: input.createdByUserId
      }
    });

    return mapProductMedia(media);
  }

  public async reorder(productId: string, orderedIds: string[]): Promise<void> {
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.productMedia.update({
          where: { id },
          data: { position: index }
        })
      )
    );
  }

  public async softDelete(id: string, deletedAt: Date): Promise<void> {
    await prisma.productMedia.update({
      where: { id },
      data: { deletedAt }
    });
  }
}

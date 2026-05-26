import { randomUUID } from "node:crypto";

import { ResourceError } from "@/core/errors/resource-error.js";
import type {
  ProductMediaRecord,
  IProductMediaProvider,
  IStorageProvider
} from "@/providers/contracts.js";
import type { RegisterMediaInput, PresignMediaInput } from "@/modules/catalog/media/schemas/media.schema.js";

type ServiceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
};

export class MediaService {
  public constructor(
    private readonly mediaProvider: IProductMediaProvider,
    private readonly storageProvider: IStorageProvider
  ) {}

  public async listByProductId(productId: string): Promise<ProductMediaRecord[]> {
    return this.mediaProvider.listByProductId(productId);
  }

  public async register(productId: string, input: RegisterMediaInput, context: ServiceContext): Promise<ProductMediaRecord> {
    const media = await this.mediaProvider.create({
      productId,
      storageKey: input.storageKey,
      cdnUrl: input.cdnUrl,
      altText: input.altText ?? null,
      mediaType: "IMAGE",
      position: input.position ?? 0,
      isPrimary: input.isPrimary ?? false,
      width: null,
      height: null,
      createdByUserId: context.userId ?? null
    });

    return media;
  }

  public async presignUpload(productId: string, input: PresignMediaInput, _context: ServiceContext): Promise<{ uploadUrl: string; storageKey: string }> {
    const extension = input.fileName.split(".").pop() ?? "bin";
    const storageKey = `products/${productId}/media/${randomUUID()}.${extension}`;

    const uploadUrl = await this.storageProvider.getSignedUrl(storageKey, 3600);

    return { uploadUrl, storageKey };
  }

  public async reorder(productId: string, orderedIds: string[], _context: ServiceContext): Promise<void> {
    await this.mediaProvider.reorder(productId, orderedIds);
  }

  public async softDelete(productId: string, mediaId: string, _context: ServiceContext): Promise<void> {
    const media = await this.mediaProvider.findById(mediaId);
    if (!media || media.deletedAt) {
      throw new ResourceError("MEDIA.NOT_FOUND", "Media not found.");
    }

    if (media.productId !== productId) {
      throw new ResourceError("MEDIA.NOT_FOUND", "Media not found for this product.");
    }

    await this.mediaProvider.softDelete(mediaId, new Date());
    await this.storageProvider.delete(media.storageKey);
  }
}

import { ResourceError } from "@/core/errors/resource-error.js";
import { RequestError } from "@/core/errors/request-error.js";
import type { IAuditProvider } from "@/providers/contracts.js";
import type { IFavoriteProvider, FavoriteRecord } from "@/providers/contracts-fase4.js";
import type { AddFavoriteInput } from "@/modules/favorites/schemas/favorite.schema.js";

type ServiceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
};

export class FavoriteService {
  public constructor(
    private readonly favoriteProvider: IFavoriteProvider,
    private readonly auditProvider: IAuditProvider
  ) {}

  public async listByUserId(userId: string): Promise<FavoriteRecord[]> {
    return this.favoriteProvider.listByUserId(userId);
  }

  public async add(userId: string, input: AddFavoriteInput, context: ServiceContext): Promise<FavoriteRecord> {
    const existing = await this.favoriteProvider.findByUserAndProduct(userId, input.productId);
    if (existing) {
      throw new RequestError("FAVORITE.ALREADY_EXISTS", "Product already in favorites.");
    }

    const favorite = await this.favoriteProvider.create({
      userId,
      productId: input.productId
    });

    await this.auditProvider.emit({
      eventType: "FAVORITE_ADDED",
      eventCategory: "USER",
      actorType: "USER",
      actorUserId: userId,
      targetType: "PRODUCT",
      targetId: input.productId,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });

    return favorite;
  }

  public async remove(userId: string, productId: string, context: ServiceContext): Promise<void> {
    const existing = await this.favoriteProvider.findByUserAndProduct(userId, productId);
    if (!existing) {
      throw new ResourceError("FAVORITE.NOT_FOUND", "Favorite not found.");
    }

    await this.favoriteProvider.delete(userId, productId);

    await this.auditProvider.emit({
      eventType: "FAVORITE_REMOVED",
      eventCategory: "USER",
      actorType: "USER",
      actorUserId: userId,
      targetType: "PRODUCT",
      targetId: productId,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });
  }

  public async toggle(userId: string, input: AddFavoriteInput, context: ServiceContext): Promise<{ added: boolean }> {
    const existing = await this.favoriteProvider.findByUserAndProduct(userId, input.productId);

    if (existing) {
      await this.favoriteProvider.delete(userId, input.productId);

      await this.auditProvider.emit({
        eventType: "FAVORITE_REMOVED",
        eventCategory: "USER",
        actorType: "USER",
        actorUserId: userId,
        targetType: "PRODUCT",
        targetId: input.productId,
        traceId: context.traceId,
        requestId: context.requestId,
        outcome: "SUCCESS"
      });

      return { added: false };
    }

    await this.favoriteProvider.create({
      userId,
      productId: input.productId
    });

    await this.auditProvider.emit({
      eventType: "FAVORITE_ADDED",
      eventCategory: "USER",
      actorType: "USER",
      actorUserId: userId,
      targetType: "PRODUCT",
      targetId: input.productId,
      traceId: context.traceId,
      requestId: context.requestId,
      outcome: "SUCCESS"
    });

    return { added: true };
  }
}

import type { FavoriteRecord, IFavoriteProvider } from "@/providers/contracts-fase4.js";
import { prisma } from "@/providers/prisma.js";

const mapFavorite = (favorite: {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
}): FavoriteRecord => ({
  id: favorite.id,
  userId: favorite.userId,
  productId: favorite.productId,
  createdAt: favorite.createdAt
});

export class PrismaFavoriteProvider implements IFavoriteProvider {
  public async findByUserAndProduct(userId: string, productId: string): Promise<FavoriteRecord | null> {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: { userId, productId }
      }
    });
    return favorite ? mapFavorite(favorite) : null;
  }

  public async listByUserId(userId: string): Promise<FavoriteRecord[]> {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    return favorites.map(mapFavorite);
  }

  public async create(
    input: Omit<FavoriteRecord, "id" | "createdAt">
  ): Promise<FavoriteRecord> {
    const favorite = await prisma.favorite.create({
      data: {
        userId: input.userId,
        productId: input.productId
      }
    });
    return mapFavorite(favorite);
  }

  public async delete(userId: string, productId: string): Promise<void> {
    await prisma.favorite.delete({
      where: {
        userId_productId: { userId, productId }
      }
    });
  }
}

import { env } from "@/config/env.js";
import type { IRbacProvider } from "@/providers/contracts.js";
import type { IPermissionCacheProvider } from "@/providers/contracts.js";
import { prisma } from "@/providers/prisma.js";

export class PrismaRbacProvider implements IRbacProvider {
  public constructor(private readonly cacheProvider: IPermissionCacheProvider) {}

  public async getUserPermissions(sessionId: string, userId: string): Promise<string[]> {
    const cached = await this.cacheProvider.get(sessionId);
    if (cached) {
      return cached;
    }

    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const permissions = Array.from(
      new Set(
        userRoles.flatMap((userRole) =>
          userRole.role.permissions.map(
            (rolePermission) => rolePermission.permission.name
          )
        )
      )
    );

    await this.cacheProvider.set(sessionId, permissions, env.PERMISSION_CACHE_TTL_SECONDS);

    return permissions;
  }

  public async getUserRoles(userId: string): Promise<string[]> {
    const roles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true }
    });

    return roles.map((entry) => entry.role.name);
  }

  public async invalidatePermissionCache(sessionId: string): Promise<void> {
    await this.cacheProvider.delete(sessionId);
  }
}

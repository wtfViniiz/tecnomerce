import type { Prisma } from "@prisma/client";

import type { ISessionProvider, SessionRecord } from "@/providers/contracts.js";
import { prisma } from "@/providers/prisma.js";

const activeSessionWhere = {
  revokedAt: null,
  compromisedAt: null
} as const;

const mapSession = (session: {
  id: string;
  userId: string;
  chainId: string;
  refreshTokenLookupHash: string;
  refreshTokenHash: string;
  previousRefreshTokenLookupHash: string | null;
  previousRefreshTokenHash: string | null;
  tokenVersion: number;
  permissionsVersion: number;
  revokedAt: Date | null;
  compromisedAt: Date | null;
  lastUsedAt: Date | null;
  expiresAt: Date;
  replacedBySessionId: string | null;
  isTwoFactorVerified: boolean;
  stepUpVerifiedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SessionRecord => ({
  id: session.id,
  userId: session.userId,
  chainId: session.chainId,
  refreshTokenLookupHash: session.refreshTokenLookupHash,
  refreshTokenHash: session.refreshTokenHash,
  previousRefreshTokenLookupHash: session.previousRefreshTokenLookupHash,
  previousRefreshTokenHash: session.previousRefreshTokenHash,
  tokenVersion: session.tokenVersion,
  permissionsVersion: session.permissionsVersion,
  revokedAt: session.revokedAt,
  compromisedAt: session.compromisedAt,
  lastUsedAt: session.lastUsedAt,
  expiresAt: session.expiresAt,
  replacedBySessionId: session.replacedBySessionId,
  isTwoFactorVerified: session.isTwoFactorVerified,
  stepUpVerifiedAt: session.stepUpVerifiedAt,
  ipAddress: session.ipAddress,
  userAgent: session.userAgent,
  deviceName: session.deviceName,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt
});

export class PrismaSessionProvider implements ISessionProvider {
  public async createSession(input: Omit<SessionRecord, "createdAt" | "updatedAt">): Promise<SessionRecord> {
    const session = await prisma.session.create({
      data: {
        id: input.id,
        userId: input.userId,
        chainId: input.chainId,
        refreshTokenLookupHash: input.refreshTokenLookupHash,
        refreshTokenHash: input.refreshTokenHash,
        previousRefreshTokenLookupHash: input.previousRefreshTokenLookupHash,
        previousRefreshTokenHash: input.previousRefreshTokenHash,
        tokenVersion: input.tokenVersion,
        permissionsVersion: input.permissionsVersion,
        revokedAt: input.revokedAt,
        compromisedAt: input.compromisedAt,
        lastUsedAt: input.lastUsedAt,
        expiresAt: input.expiresAt,
        replacedBySessionId: input.replacedBySessionId,
        isTwoFactorVerified: input.isTwoFactorVerified,
        stepUpVerifiedAt: input.stepUpVerifiedAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        deviceName: input.deviceName
      }
    });

    return mapSession(session);
  }

  public async findSessionById(sessionId: string): Promise<SessionRecord | null> {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    return session ? mapSession(session) : null;
  }

  public async findSessionByRefreshLookupHash(refreshTokenLookupHash: string): Promise<SessionRecord | null> {
    const session = await prisma.session.findFirst({
      where: {
        OR: [
          { refreshTokenLookupHash },
          { previousRefreshTokenLookupHash: refreshTokenLookupHash }
        ]
      }
    });
    return session ? mapSession(session) : null;
  }

  public async revokeSession(sessionId: string, revokedAt: Date): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt }
    });
  }

  public async revokeAllUserSessions(userId: string, revokedAt: Date): Promise<void> {
    await prisma.session.updateMany({
      where: {
        userId,
        ...activeSessionWhere
      },
      data: { revokedAt }
    });
  }

  public async rotateRefreshToken(
    sessionId: string,
    input: Pick<
      SessionRecord,
      | "refreshTokenHash"
      | "refreshTokenLookupHash"
      | "previousRefreshTokenHash"
      | "previousRefreshTokenLookupHash"
      | "lastUsedAt"
      | "expiresAt"
      | "replacedBySessionId"
      | "stepUpVerifiedAt"
    >
  ): Promise<SessionRecord> {
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: input.refreshTokenHash,
        refreshTokenLookupHash: input.refreshTokenLookupHash,
        previousRefreshTokenHash: input.previousRefreshTokenHash,
        previousRefreshTokenLookupHash: input.previousRefreshTokenLookupHash,
        lastUsedAt: input.lastUsedAt,
        expiresAt: input.expiresAt,
        replacedBySessionId: input.replacedBySessionId,
        stepUpVerifiedAt: input.stepUpVerifiedAt
      }
    });

    return mapSession(session);
  }

  public async listActiveSessions(userId: string): Promise<SessionRecord[]> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        ...activeSessionWhere,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    return sessions.map(mapSession);
  }

  public async markCompromised(userId: string, sessionId: string, compromisedAt: Date): Promise<void> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return;
    }

    await prisma.$transaction([
      prisma.session.updateMany({
        where: {
          userId,
          chainId: session.chainId
        },
        data: {
          compromisedAt,
          revokedAt: compromisedAt
        }
      }),
      prisma.session.updateMany({
        where: {
          userId,
          ...activeSessionWhere
        },
        data: {
          revokedAt: compromisedAt
        }
      })
    ] as Prisma.PrismaPromise<unknown>[]);
  }
}

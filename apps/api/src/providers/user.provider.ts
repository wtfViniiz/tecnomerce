import type { UserRecord, IUserProvider } from "@/providers/contracts.js";
import { prisma } from "@/providers/prisma.js";

const mapUser = (user: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  tokenVersion: number;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  twoFaEnabled: boolean;
  twoFaSecret: string | null;
  twoFaBackupHashes: string[];
}): UserRecord => ({
  id: user.id,
  email: user.email,
  name: user.name,
  passwordHash: user.passwordHash,
  tokenVersion: user.tokenVersion,
  isActive: user.isActive,
  emailVerified: user.emailVerified,
  lastLoginAt: user.lastLoginAt,
  twoFaEnabled: user.twoFaEnabled,
  twoFaSecret: user.twoFaSecret,
  twoFaBackupHashes: user.twoFaBackupHashes
});

export class PrismaUserProvider implements IUserProvider {
  public async findById(userId: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? mapUser(user) : null;
  }

  public async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? mapUser(user) : null;
  }

  public async create(
    input: Omit<UserRecord, "lastLoginAt"> & { lastLoginAt?: Date | null }
  ): Promise<UserRecord> {
    const user = await prisma.user.create({
      data: {
        id: input.id,
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash,
        tokenVersion: input.tokenVersion,
        isActive: input.isActive,
        emailVerified: input.emailVerified,
        lastLoginAt: input.lastLoginAt ?? null,
        twoFaEnabled: input.twoFaEnabled,
        twoFaSecret: input.twoFaSecret,
        twoFaBackupHashes: input.twoFaBackupHashes
      }
    });

    return mapUser(user);
  }

  public async update(userId: string, input: Partial<UserRecord>): Promise<UserRecord> {
    const data = {
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.passwordHash !== undefined ? { passwordHash: input.passwordHash } : {}),
      ...(input.tokenVersion !== undefined ? { tokenVersion: input.tokenVersion } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.emailVerified !== undefined ? { emailVerified: input.emailVerified } : {}),
      ...(input.lastLoginAt !== undefined ? { lastLoginAt: input.lastLoginAt } : {}),
      ...(input.twoFaEnabled !== undefined ? { twoFaEnabled: input.twoFaEnabled } : {}),
      ...(input.twoFaSecret !== undefined ? { twoFaSecret: input.twoFaSecret } : {}),
      ...(input.twoFaBackupHashes !== undefined
        ? { twoFaBackupHashes: input.twoFaBackupHashes }
        : {})
    };

    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    return mapUser(user);
  }

  public async updateTokenVersion(userId: string, tokenVersion: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion }
    });
  }

  public async updateLastLogin(userId: string, lastLoginAt: Date): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt }
    });
  }
}

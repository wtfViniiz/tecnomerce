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
  userType: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
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
  twoFaBackupHashes: user.twoFaBackupHashes,
  userType: user.userType as UserRecord["userType"],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  deletedAt: user.deletedAt
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
        twoFaBackupHashes: input.twoFaBackupHashes,
        userType: input.userType,
        deletedAt: input.deletedAt
      }
    });

    return mapUser(user);
  }

  public async update(userId: string, input: Partial<UserRecord>): Promise<UserRecord> {
    const data: Record<string, unknown> = {};

    if (input.email !== undefined) data.email = input.email;
    if (input.name !== undefined) data.name = input.name;
    if (input.passwordHash !== undefined) data.passwordHash = input.passwordHash;
    if (input.tokenVersion !== undefined) data.tokenVersion = input.tokenVersion;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.emailVerified !== undefined) data.emailVerified = input.emailVerified;
    if (input.lastLoginAt !== undefined) data.lastLoginAt = input.lastLoginAt;
    if (input.twoFaEnabled !== undefined) data.twoFaEnabled = input.twoFaEnabled;
    if (input.twoFaSecret !== undefined) data.twoFaSecret = input.twoFaSecret;
    if (input.twoFaBackupHashes !== undefined) data.twoFaBackupHashes = input.twoFaBackupHashes;

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

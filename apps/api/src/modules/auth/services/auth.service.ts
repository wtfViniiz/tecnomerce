import { randomUUID } from "node:crypto";

import { authenticator } from "otplib";
import QRCode from "qrcode";

import { authConfig } from "@/config/auth.js";
import { AuthError } from "@/core/errors/auth-error.js";
import { RequestError } from "@/core/errors/request-error.js";
import { RbacError } from "@/core/errors/rbac-error.js";
import { encryptSensitive, decryptSensitive } from "@/core/security/crypto.util.js";
import { hashPassword, verifyPassword } from "@/core/security/password.util.js";
import type {
  AccessTokenPayload,
  IAuditProvider,
  IRbacProvider,
  ISessionProvider,
  ITokenProvider,
  IUserProvider,
  SessionRecord,
  UserRecord
} from "@/providers/contracts.js";

type RequestContext = {
  traceId: string;
  requestId: string;
  ipAddress: string;
  userAgent: string;
  deviceName: string | null;
};

type LoginInput = {
  email: string;
  password: string;
  twoFaToken?: string;
  context: RequestContext;
};

type RefreshInput = {
  rawRefreshToken: string;
  context: RequestContext;
};

type RevokeSessionInput = {
  actorSessionId: string;
  targetSessionId: string;
  confirmCurrentSession?: boolean;
};

type DisableTwoFaInput = {
  userId: string;
  currentPassword: string;
  token: string;
  context: RequestContext;
};

type StepUpInput = {
  userId: string;
  sessionId: string;
  token: string;
  context: RequestContext;
};

const refreshSessionDurationMs = authConfig.refreshSessionTtlDays * 24 * 60 * 60 * 1000;
const stepUpTtlMs = authConfig.stepUpTtlMinutes * 60 * 1000;

authenticator.options = {
  window: 1
};

export class AuthService {
  public constructor(
    private readonly userProvider: IUserProvider,
    private readonly sessionProvider: ISessionProvider,
    private readonly tokenProvider: ITokenProvider,
    private readonly rbacProvider: IRbacProvider,
    private readonly auditProvider: IAuditProvider
  ) {}

  public async login(input: LoginInput): Promise<
    | {
        requiresTwoFactor: true;
      }
    | {
        requiresTwoFactor: false;
        accessToken: string;
        refreshToken: string;
        session: SessionRecord;
      }
  > {
    const user = await this.userProvider.findByEmail(input.email);
    if (!user || !user.isActive) {
      await this.auditProvider.emit({
        eventType: "LOGIN_FAILURE",
        eventCategory: "AUTH",
        actorType: "SYSTEM",
        targetType: "USER",
        traceId: input.context.traceId,
        requestId: input.context.requestId,
        ipAddress: input.context.ipAddress,
        userAgent: input.context.userAgent,
        outcome: "FAILURE"
      });
      throw new AuthError("AUTH.INVALID_CREDENTIALS", "Invalid credentials.");
    }

    const passwordMatches = await verifyPassword(user.passwordHash, input.password);
    if (!passwordMatches) {
      await this.auditProvider.emit({
        eventType: "LOGIN_FAILURE",
        eventCategory: "AUTH",
        actorType: user.twoFaEnabled ? "ADMIN" : "USER",
        actorUserId: user.id,
        targetType: "USER",
        targetId: user.id,
        traceId: input.context.traceId,
        requestId: input.context.requestId,
        ipAddress: input.context.ipAddress,
        userAgent: input.context.userAgent,
        outcome: "FAILURE"
      });
      throw new AuthError("AUTH.INVALID_CREDENTIALS", "Invalid credentials.");
    }

    const isAdmin = (await this.rbacProvider.getUserRoles(user.id)).includes("admin");
    if (isAdmin && user.twoFaEnabled && !input.twoFaToken) {
      return { requiresTwoFactor: true };
    }

    if (isAdmin && user.twoFaEnabled && input.twoFaToken) {
      const isValidTwoFactor = await this.verifyTwoFactorToken(user, input.twoFaToken);
      if (!isValidTwoFactor) {
        await this.auditProvider.emit({
          eventType: "TWO_FA_FAILURE",
          eventCategory: "AUTH",
          actorType: "ADMIN",
          actorUserId: user.id,
          targetType: "USER",
          targetId: user.id,
          traceId: input.context.traceId,
          requestId: input.context.requestId,
          ipAddress: input.context.ipAddress,
          userAgent: input.context.userAgent,
          outcome: "FAILURE"
        });
        throw new AuthError("AUTH.INVALID_TWO_FA_TOKEN", "Invalid two-factor token.");
      }
    }

    const { accessToken, refreshToken, session } = await this.createAuthenticatedSession({
      user,
      isTwoFactorVerified: !isAdmin || user.twoFaEnabled,
      context: input.context
    });

    await this.userProvider.updateLastLogin(user.id, new Date());
    await this.auditProvider.emit({
      eventType: "LOGIN_SUCCESS",
      eventCategory: "AUTH",
      actorType: isAdmin ? "ADMIN" : "USER",
      actorUserId: user.id,
      targetType: "SESSION",
      targetId: session.id,
      traceId: input.context.traceId,
      requestId: input.context.requestId,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
      outcome: "SUCCESS"
    });

    return {
      requiresTwoFactor: false,
      accessToken,
      refreshToken,
      session
    };
  }

  public async register(input: {
    name: string;
    email: string;
    password: string;
    context: RequestContext;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    session: SessionRecord;
  }> {
    const existingUser = await this.userProvider.findByEmail(input.email);
    if (existingUser) {
      throw new RequestError("REQUEST.EMAIL_ALREADY_EXISTS", "An account with this email already exists.");
    }

    const passwordHash = await hashPassword(input.password);
    const userId = randomUUID();
    const now = new Date();

    const user = await this.userProvider.create({
      id: userId,
      email: input.email,
      name: input.name,
      passwordHash,
      tokenVersion: 0,
      isActive: true,
      emailVerified: false,
      lastLoginAt: now,
      twoFaEnabled: false,
      twoFaSecret: null,
      twoFaBackupHashes: [],
      userType: "CUSTOMER",
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    });

    const { accessToken, refreshToken, session } = await this.createAuthenticatedSession({
      user,
      isTwoFactorVerified: true,
      context: input.context
    });

    await this.userProvider.updateLastLogin(user.id, now);
    await this.auditProvider.emit({
      eventType: "REGISTER_SUCCESS",
      eventCategory: "AUTH",
      actorType: "USER",
      actorUserId: user.id,
      targetType: "USER",
      targetId: user.id,
      traceId: input.context.traceId,
      requestId: input.context.requestId,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
      outcome: "SUCCESS"
    });

    return { accessToken, refreshToken, session };
  }

  public async refresh(input: RefreshInput): Promise<{
    accessToken: string;
    refreshToken: string;
    session: SessionRecord;
  }> {
    const lookupHash = await this.tokenProvider.generateRefreshTokenLookupHash(input.rawRefreshToken);
    const session = await this.sessionProvider.findSessionByRefreshLookupHash(lookupHash);

    if (!session) {
      throw new AuthError("AUTH.INVALID_REFRESH_TOKEN", "Invalid refresh token.");
    }

    const isPreviousTokenReuse = session.previousRefreshTokenLookupHash === lookupHash;
    const hashToVerify = isPreviousTokenReuse
      ? session.previousRefreshTokenHash
      : session.refreshTokenHash;

    if (!hashToVerify) {
      throw new AuthError("AUTH.INVALID_REFRESH_TOKEN", "Invalid refresh token.");
    }

    const validHash = await this.tokenProvider.verifyRefreshTokenHash(input.rawRefreshToken, hashToVerify);
    if (!validHash) {
      throw new AuthError("AUTH.INVALID_REFRESH_TOKEN", "Invalid refresh token.");
    }

    if (isPreviousTokenReuse) {
      await this.sessionProvider.markCompromised(session.userId, session.id, new Date());
      await this.auditProvider.emit({
        eventType: "SESSION_REUSE_DETECTED",
        eventCategory: "AUTH",
        actorType: "SYSTEM",
        actorUserId: session.userId,
        targetType: "SESSION",
        targetId: session.id,
        traceId: input.context.traceId,
        requestId: input.context.requestId,
        ipAddress: input.context.ipAddress,
        userAgent: input.context.userAgent,
        outcome: "FAILURE"
      });
      throw new AuthError("AUTH.SESSION_COMPROMISED", "Session compromised.");
    }

    if (session.revokedAt || session.compromisedAt || session.expiresAt <= new Date()) {
      throw new AuthError("AUTH.INVALID_REFRESH_TOKEN", "Invalid refresh token.");
    }

    const user = await this.userProvider.findById(session.userId);
    if (!user || user.tokenVersion !== session.tokenVersion) {
      throw new AuthError("AUTH.INVALID_REFRESH_TOKEN", "Invalid refresh token.");
    }

    const newRefreshToken = await this.tokenProvider.generateRefreshToken();
    const newRefreshTokenLookupHash = await this.tokenProvider.generateRefreshTokenLookupHash(newRefreshToken);
    const newRefreshTokenHash = await this.tokenProvider.hashRefreshToken(newRefreshToken);
    const rotatedSession = await this.sessionProvider.rotateRefreshToken(session.id, {
      refreshTokenHash: newRefreshTokenHash,
      refreshTokenLookupHash: newRefreshTokenLookupHash,
      previousRefreshTokenHash: session.refreshTokenHash,
      previousRefreshTokenLookupHash: session.refreshTokenLookupHash,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + refreshSessionDurationMs),
      replacedBySessionId: null,
      stepUpVerifiedAt: session.stepUpVerifiedAt
    });

    const accessToken = await this.signAccessToken({
      sub: user.id,
      sessionId: rotatedSession.id,
      tokenVersion: user.tokenVersion,
      permissionsVersion: rotatedSession.permissionsVersion,
      traceId: input.context.traceId
    });

    await this.auditProvider.emit({
      eventType: "SESSION_REFRESH",
      eventCategory: "AUTH",
      actorType: "USER",
      actorUserId: user.id,
      targetType: "SESSION",
      targetId: rotatedSession.id,
      traceId: input.context.traceId,
      requestId: input.context.requestId,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
      outcome: "SUCCESS"
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      session: rotatedSession
    };
  }

  public async logout(userId: string, sessionId: string, context: RequestContext): Promise<void> {
    await this.sessionProvider.revokeSession(sessionId, new Date());
    await this.auditProvider.emit({
      eventType: "LOGOUT",
      eventCategory: "AUTH",
      actorType: "USER",
      actorUserId: userId,
      targetType: "SESSION",
      targetId: sessionId,
      traceId: context.traceId,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      outcome: "SUCCESS"
    });
  }

  public async logoutAll(userId: string, tokenVersion: number, context: RequestContext): Promise<void> {
    await this.sessionProvider.revokeAllUserSessions(userId, new Date());
    await this.userProvider.updateTokenVersion(userId, tokenVersion + 1);
    await this.auditProvider.emit({
      eventType: "LOGOUT_ALL",
      eventCategory: "AUTH",
      actorType: "USER",
      actorUserId: userId,
      targetType: "USER",
      targetId: userId,
      traceId: context.traceId,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      outcome: "SUCCESS"
    });
  }

  public async listSessions(userId: string): Promise<SessionRecord[]> {
    return this.sessionProvider.listActiveSessions(userId);
  }

  public async revokeSession(
    userId: string,
    input: RevokeSessionInput,
    context: RequestContext
  ): Promise<void> {
    if (input.targetSessionId === input.actorSessionId && !input.confirmCurrentSession) {
      throw new RequestError(
        "REQUEST.CONFIRM_CURRENT_SESSION_REQUIRED",
        "Explicit confirmation is required to revoke the current session."
      );
    }

    const session = await this.sessionProvider.findSessionById(input.targetSessionId);
    if (!session || session.userId !== userId) {
      throw new RequestError("REQUEST.SESSION_NOT_FOUND", "Session not found.");
    }

    await this.sessionProvider.revokeSession(input.targetSessionId, new Date());
    await this.auditProvider.emit({
      eventType: "SESSION_REVOKED",
      eventCategory: "AUTH",
      actorType: "USER",
      actorUserId: userId,
      targetType: "SESSION",
      targetId: input.targetSessionId,
      traceId: context.traceId,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      outcome: "SUCCESS"
    });
  }

  public async enrollTwoFactor(userId: string, context: RequestContext): Promise<{
    secret: string;
    qrCodeDataUrl: string;
  }> {
    const user = await this.requireUser(userId);
    const secret = authenticator.generateSecret();
    const encryptedSecret = encryptSensitive(secret);

    await this.userProvider.update(user.id, {
      twoFaSecret: encryptedSecret,
      twoFaEnabled: false
    });

    const otpAuthUrl = authenticator.keyuri(user.email, "coremd", secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    await this.auditProvider.emit({
      eventType: "TWO_FA_ENROLL",
      eventCategory: "AUTH",
      actorType: "ADMIN",
      actorUserId: user.id,
      targetType: "USER",
      targetId: user.id,
      traceId: context.traceId,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      outcome: "SUCCESS"
    });

    return {
      secret,
      qrCodeDataUrl
    };
  }

  public async verifyTwoFactorEnrollment(
    userId: string,
    token: string,
    context: RequestContext
  ): Promise<{ backupCodes: string[] }> {
    const user = await this.requireUser(userId);
    const secret = this.requireTwoFaSecret(user);

    const valid = authenticator.verify({ token, secret });
    if (!valid) {
      throw new AuthError("AUTH.INVALID_TWO_FA_TOKEN", "Invalid two-factor token.");
    }

    const backupCodes = Array.from({ length: 8 }, () => randomUUID().replace(/-/g, "").slice(0, 10));
    const backupHashes = await Promise.all(backupCodes.map((code) => hashPassword(code)));

    await this.userProvider.update(userId, {
      twoFaEnabled: true,
      twoFaBackupHashes: backupHashes
    });

    await this.auditProvider.emit({
      eventType: "TWO_FA_VERIFY",
      eventCategory: "AUTH",
      actorType: "ADMIN",
      actorUserId: user.id,
      targetType: "USER",
      targetId: user.id,
      traceId: context.traceId,
      requestId: context.requestId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      outcome: "SUCCESS"
    });

    return { backupCodes };
  }

  public async disableTwoFactor(input: DisableTwoFaInput): Promise<void> {
    const user = await this.requireUser(input.userId);
    const passwordMatches = await verifyPassword(user.passwordHash, input.currentPassword);
    if (!passwordMatches) {
      throw new AuthError("AUTH.INVALID_CREDENTIALS", "Invalid credentials.");
    }

    const secret = this.requireTwoFaSecret(user);
    const valid = authenticator.verify({ token: input.token, secret });
    if (!valid) {
      throw new AuthError("AUTH.INVALID_TWO_FA_TOKEN", "Invalid two-factor token.");
    }

    await this.userProvider.update(user.id, {
      twoFaEnabled: false,
      twoFaSecret: null,
      twoFaBackupHashes: []
    });

    await this.auditProvider.emit({
      eventType: "TWO_FA_DISABLE",
      eventCategory: "AUTH",
      actorType: "ADMIN",
      actorUserId: user.id,
      targetType: "USER",
      targetId: user.id,
      traceId: input.context.traceId,
      requestId: input.context.requestId,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
      outcome: "SUCCESS"
    });
  }

  public async stepUp(input: StepUpInput): Promise<SessionRecord> {
    const user = await this.requireUser(input.userId);
    const session = await this.requireSession(input.sessionId);
    const secret = this.requireTwoFaSecret(user);

    const valid = authenticator.verify({ token: input.token, secret });
    if (!valid) {
      throw new AuthError("AUTH.INVALID_TWO_FA_TOKEN", "Invalid two-factor token.");
    }

    const updatedSession = await this.sessionProvider.rotateRefreshToken(session.id, {
      refreshTokenHash: session.refreshTokenHash,
      refreshTokenLookupHash: session.refreshTokenLookupHash,
      previousRefreshTokenHash: session.previousRefreshTokenHash,
      previousRefreshTokenLookupHash: session.previousRefreshTokenLookupHash,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      replacedBySessionId: session.replacedBySessionId,
      stepUpVerifiedAt: new Date()
    });

    await this.auditProvider.emit({
      eventType: "STEP_UP_SUCCESS",
      eventCategory: "AUTH",
      actorType: "ADMIN",
      actorUserId: user.id,
      targetType: "SESSION",
      targetId: session.id,
      traceId: input.context.traceId,
      requestId: input.context.requestId,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
      outcome: "SUCCESS"
    });

    return updatedSession;
  }

  public async me(userId: string, sessionId: string): Promise<{
    user: UserRecord;
    session: SessionRecord;
    permissions: string[];
  }> {
    const user = await this.requireUser(userId);
    const session = await this.requireSession(sessionId);
    const permissions = await this.rbacProvider.getUserPermissions(sessionId, userId);

    return { user, session, permissions };
  }

  public isStepUpActive(session: SessionRecord): boolean {
    if (!session.stepUpVerifiedAt) {
      return false;
    }

    return Date.now() - session.stepUpVerifiedAt.getTime() <= stepUpTtlMs;
  }

  private async createAuthenticatedSession(input: {
    user: UserRecord;
    isTwoFactorVerified: boolean;
    context: RequestContext;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    session: SessionRecord;
  }> {
    const refreshToken = await this.tokenProvider.generateRefreshToken();
    const refreshTokenLookupHash =
      await this.tokenProvider.generateRefreshTokenLookupHash(refreshToken);
    const refreshTokenHash = await this.tokenProvider.hashRefreshToken(refreshToken);
    const session = await this.sessionProvider.createSession({
      id: randomUUID(),
      userId: input.user.id,
      chainId: randomUUID(),
      refreshTokenLookupHash,
      refreshTokenHash,
      previousRefreshTokenLookupHash: null,
      previousRefreshTokenHash: null,
      tokenVersion: input.user.tokenVersion,
      permissionsVersion: 0,
      revokedAt: null,
      compromisedAt: null,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + refreshSessionDurationMs),
      replacedBySessionId: null,
      isTwoFactorVerified: input.isTwoFactorVerified,
      stepUpVerifiedAt: null,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
      deviceName: input.context.deviceName
    });

    const accessToken = await this.signAccessToken({
      sub: input.user.id,
      sessionId: session.id,
      tokenVersion: input.user.tokenVersion,
      permissionsVersion: session.permissionsVersion,
      traceId: input.context.traceId
    });

    return {
      accessToken,
      refreshToken,
      session
    };
  }

  private async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.tokenProvider.signAccessToken(payload);
  }

  private async verifyTwoFactorToken(user: UserRecord, token: string): Promise<boolean> {
    if (!user.twoFaSecret) {
      return false;
    }

    const secret = decryptSensitive(user.twoFaSecret);
    const validTotp = authenticator.verify({ token, secret });
    if (validTotp) {
      return true;
    }

    for (const backupHash of user.twoFaBackupHashes) {
      const matches = await verifyPassword(backupHash, token);
      if (matches) {
        const nextHashes = [];
        for (const existingHash of user.twoFaBackupHashes) {
          if (existingHash !== backupHash) {
            nextHashes.push(existingHash);
          }
        }
        await this.userProvider.update(user.id, {
          twoFaBackupHashes: nextHashes
        });
        return true;
      }
    }

    return false;
  }

  private requireTwoFaSecret(user: UserRecord): string {
    if (!user.twoFaSecret) {
      throw new RequestError("REQUEST.TWO_FA_NOT_ENROLLED", "Two-factor secret not enrolled.");
    }

    return decryptSensitive(user.twoFaSecret);
  }

  private async requireUser(userId: string): Promise<UserRecord> {
    const user = await this.userProvider.findById(userId);
    if (!user) {
      throw new AuthError("AUTH.USER_NOT_FOUND", "User not found.");
    }

    return user;
  }

  private async requireSession(sessionId: string): Promise<SessionRecord> {
    const session = await this.sessionProvider.findSessionById(sessionId);
    if (!session) {
      throw new AuthError("AUTH.SESSION_NOT_FOUND", "Session not found.");
    }

    return session;
  }
}

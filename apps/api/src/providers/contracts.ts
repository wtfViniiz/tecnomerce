export type UserRecord = {
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
};

export type SessionRecord = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  refreshTokenLookupHash: string;
  previousRefreshTokenHash: string | null;
  previousRefreshTokenLookupHash: string | null;
  chainId: string;
  tokenVersion: number;
  permissionsVersion: number;
  expiresAt: Date;
  lastUsedAt: Date | null;
  isTwoFactorVerified: boolean;
  stepUpVerifiedAt: Date | null;
  revokedAt: Date | null;
  compromisedAt: Date | null;
  replacedBySessionId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuditEvent = {
  eventType: string;
  eventCategory: string;
  actorType: "USER" | "ADMIN" | "SYSTEM" | "PROVIDER";
  actorUserId?: string;
  targetType: string;
  targetId?: string;
  requestId?: string;
  traceId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  outcome: "SUCCESS" | "FAILURE";
};

export interface IUserProvider {
  findById(userId: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(input: Omit<UserRecord, "lastLoginAt"> & { lastLoginAt?: Date | null }): Promise<UserRecord>;
  update(userId: string, input: Partial<UserRecord>): Promise<UserRecord>;
  updateTokenVersion(userId: string, tokenVersion: number): Promise<void>;
  updateLastLogin(userId: string, lastLoginAt: Date): Promise<void>;
}

export interface ISessionProvider {
  createSession(input: Omit<SessionRecord, "createdAt" | "updatedAt">): Promise<SessionRecord>;
  findSessionById(sessionId: string): Promise<SessionRecord | null>;
  findSessionByRefreshLookupHash(refreshTokenLookupHash: string): Promise<SessionRecord | null>;
  revokeSession(sessionId: string, revokedAt: Date): Promise<void>;
  revokeAllUserSessions(userId: string, revokedAt: Date): Promise<void>;
  rotateRefreshToken(
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
  ): Promise<SessionRecord>;
  listActiveSessions(userId: string): Promise<SessionRecord[]>;
  markCompromised(userId: string, sessionId: string, compromisedAt: Date): Promise<void>;
}

export type AccessTokenPayload = {
  sub: string;
  sessionId: string;
  tokenVersion: number;
  permissionsVersion: number;
  traceId: string;
};

export interface ITokenProvider {
  signAccessToken(payload: AccessTokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  generateRefreshToken(): Promise<string>;
  generateRefreshTokenLookupHash(rawToken: string): Promise<string>;
  hashRefreshToken(rawToken: string): Promise<string>;
  verifyRefreshTokenHash(rawToken: string, hash: string): Promise<boolean>;
}

export interface IRbacProvider {
  getUserPermissions(sessionId: string, userId: string): Promise<string[]>;
  getUserRoles(userId: string): Promise<string[]>;
  invalidatePermissionCache(sessionId: string): Promise<void>;
}

export interface IPermissionCacheProvider {
  get(key: string): Promise<string[] | null>;
  set(key: string, permissions: string[], ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface IAuditProvider {
  emit(event: AuditEvent): Promise<void>;
}

export type TraceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
  sessionId?: string;
  module?: string;
};

export interface ITraceProvider {
  generateTraceId(): string;
  getCurrentTrace(): TraceContext | undefined;
  runWithTrace<TValue>(trace: TraceContext, callback: () => TValue): TValue;
}

export type SseConnection = {
  connectionId: string;
  userId?: string;
  sessionId?: string;
  scope: "USER" | "ADMIN" | "SYSTEM";
};

export interface ISseProvider {
  connect(connection: SseConnection): Promise<void>;
  disconnect(connectionId: string): Promise<void>;
  publish(channel: string, payload: Record<string, unknown>): Promise<void>;
  broadcast(scope: SseConnection["scope"], payload: Record<string, unknown>): Promise<void>;
  authenticateConnection(sessionId: string): Promise<boolean>;
}

export interface IQueueProvider {
  addJob(queueName: string, jobName: string, payload: Record<string, unknown>): Promise<void>;
  process(queueName: string, handler: (payload: Record<string, unknown>) => Promise<void>): Promise<void>;
  retry(queueName: string, jobId: string): Promise<void>;
  removeJob(queueName: string, jobId: string): Promise<void>;
}

export interface IStorageProvider {
  upload(key: string, content: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  exists(key: string): Promise<boolean>;
}

export interface IEmailProvider {
  sendTransactional(input: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void>;
  sendTemplate(input: {
    to: string;
    templateId: string;
    variables: Record<string, string>;
  }): Promise<void>;
}

export interface IPaymentProvider {
  createCheckout(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
  getPayment(paymentId: string): Promise<Record<string, unknown>>;
  refundPayment(paymentId: string, amountCents?: number): Promise<Record<string, unknown>>;
  validateWebhookSignature(payload: string, signature: string): Promise<boolean>;
}

export interface IShippingProvider {
  calculateShipping(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
  validateZipCode(postalCode: string): Promise<boolean>;
}

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
  userType: "CUSTOMER" | "ADMIN" | "SYSTEM";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
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
  connect(connection: SseConnection, response: import("express").Response): Promise<string>;
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

// ═══════════════════════════════════════════════════════
// Fase 3 - Catalogo e Conteudo
// ═══════════════════════════════════════════════════════

export type CategoryRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
};

export type ProductRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isCustomizable: boolean;
  couponEligible: boolean;
  productionTimeDays: number;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
};

export type ProductVariantRecord = {
  id: string;
  productId: string;
  sku: string;
  fabricId: string;
  sizeOptionId: string;
  colorOptionId: string;
  basePriceCents: number;
  promotionalPriceCents: number | null;
  currencyCode: string;
  status: string;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
};

export type ProductMediaRecord = {
  id: string;
  productId: string;
  storageKey: string;
  cdnUrl: string;
  altText: string | null;
  mediaType: "IMAGE";
  position: number;
  isPrimary: boolean;
  width: number | null;
  height: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
};

export type BannerRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  desktopMediaKey: string | null;
  mobileMediaKey: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  startsAt: Date | null;
  endsAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
};

export interface ICategoryProvider {
  findById(id: string): Promise<CategoryRecord | null>;
  findBySlug(slug: string): Promise<CategoryRecord | null>;
  list(options: { status?: string; includeDeleted?: boolean }): Promise<CategoryRecord[]>;
  create(input: Omit<CategoryRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<CategoryRecord>;
  update(id: string, input: Partial<CategoryRecord>): Promise<CategoryRecord>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
}

export interface IProductProvider {
  findById(id: string): Promise<ProductRecord | null>;
  findBySlug(slug: string): Promise<ProductRecord | null>;
  list(options: {
    status?: string;
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
  }): Promise<{ items: ProductRecord[]; total: number }>;
  create(input: Omit<ProductRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<ProductRecord>;
  update(id: string, input: Partial<ProductRecord>): Promise<ProductRecord>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
}

export interface IProductVariantProvider {
  findById(id: string): Promise<ProductVariantRecord | null>;
  listByProductId(productId: string): Promise<ProductVariantRecord[]>;
  create(input: Omit<ProductVariantRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<ProductVariantRecord>;
  update(id: string, input: Partial<ProductVariantRecord>): Promise<ProductVariantRecord>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
}

export interface IProductMediaProvider {
  findById(id: string): Promise<ProductMediaRecord | null>;
  listByProductId(productId: string): Promise<ProductMediaRecord[]>;
  create(input: Omit<ProductMediaRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<ProductMediaRecord>;
  reorder(productId: string, orderedIds: string[]): Promise<void>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
}

export interface IBannerProvider {
  findById(id: string): Promise<BannerRecord | null>;
  list(options: { status?: string; includeDeleted?: boolean }): Promise<BannerRecord[]>;
  listActive(): Promise<BannerRecord[]>;
  create(input: Omit<BannerRecord, "id" | "createdAt" | "updatedAt" | "deletedAt">): Promise<BannerRecord>;
  update(id: string, input: Partial<BannerRecord>): Promise<BannerRecord>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
}

export interface IPublicCacheProvider {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  invalidate(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

import type {
  PaymentAttemptRecord,
  PaymentStatusTransitionRecord,
  IPaymentAttemptProvider
} from "@/providers/contracts-fase4.js";
import { prisma } from "@/providers/prisma.js";
import { PaymentStatus } from "@prisma/client";

const mapPaymentAttempt = (attempt: {
  id: string;
  orderId: string;
  provider: string;
  providerPaymentId: string | null;
  providerOrderId: string | null;
  idempotencyKey: string;
  method: string;
  status: string;
  amountCents: number;
  currencyCode: string;
  failureCode: string | null;
  failureMessage: string | null;
  expiresAt: Date | null;
  authorizedAt: Date | null;
  approvedAt: Date | null;
  cancelledAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): PaymentAttemptRecord => ({
  id: attempt.id,
  orderId: attempt.orderId,
  provider: attempt.provider,
  providerPaymentId: attempt.providerPaymentId,
  providerOrderId: attempt.providerOrderId,
  idempotencyKey: attempt.idempotencyKey,
  method: attempt.method as PaymentAttemptRecord["method"],
  status: attempt.status as PaymentAttemptRecord["status"],
  amountCents: attempt.amountCents,
  currencyCode: attempt.currencyCode,
  failureCode: attempt.failureCode,
  failureMessage: attempt.failureMessage,
  expiresAt: attempt.expiresAt,
  authorizedAt: attempt.authorizedAt,
  approvedAt: attempt.approvedAt,
  cancelledAt: attempt.cancelledAt,
  refundedAt: attempt.refundedAt,
  createdAt: attempt.createdAt,
  updatedAt: attempt.updatedAt
});

const mapPaymentStatusTransition = (transition: {
  id: string;
  paymentAttemptId: string;
  fromStatus: string | null;
  toStatus: string;
  source: string;
  sourceReference: string | null;
  reason: string | null;
  traceId: string;
  createdAt: Date;
}): PaymentStatusTransitionRecord => ({
  id: transition.id,
  paymentAttemptId: transition.paymentAttemptId,
  fromStatus: transition.fromStatus,
  toStatus: transition.toStatus,
  source: transition.source,
  sourceReference: transition.sourceReference,
  reason: transition.reason,
  traceId: transition.traceId,
  createdAt: transition.createdAt
});

export class PrismaPaymentAttemptProvider implements IPaymentAttemptProvider {
  public async findById(id: string): Promise<PaymentAttemptRecord | null> {
    const attempt = await prisma.paymentAttempt.findUnique({ where: { id } });
    return attempt ? mapPaymentAttempt(attempt) : null;
  }

  public async findByOrderId(orderId: string): Promise<PaymentAttemptRecord[]> {
    const attempts = await prisma.paymentAttempt.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" }
    });
    return attempts.map(mapPaymentAttempt);
  }

  public async findByIdempotencyKey(idempotencyKey: string): Promise<PaymentAttemptRecord | null> {
    const attempt = await prisma.paymentAttempt.findUnique({
      where: { idempotencyKey }
    });
    return attempt ? mapPaymentAttempt(attempt) : null;
  }

  public async create(
    input: Omit<PaymentAttemptRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<PaymentAttemptRecord> {
    const attempt = await prisma.paymentAttempt.create({
      data: {
        orderId: input.orderId,
        provider: input.provider,
        providerPaymentId: input.providerPaymentId,
        providerOrderId: input.providerOrderId,
        idempotencyKey: input.idempotencyKey,
        method: input.method,
        status: input.status,
        amountCents: input.amountCents,
        currencyCode: input.currencyCode,
        failureCode: input.failureCode,
        failureMessage: input.failureMessage,
        expiresAt: input.expiresAt,
        authorizedAt: input.authorizedAt,
        approvedAt: input.approvedAt,
        cancelledAt: input.cancelledAt,
        refundedAt: input.refundedAt
      }
    });

    return mapPaymentAttempt(attempt);
  }

  public async updateStatus(
    id: string,
    status: PaymentAttemptRecord["status"],
    timestamps?: {
      authorizedAt?: Date;
      approvedAt?: Date;
      cancelledAt?: Date;
      refundedAt?: Date;
    }
  ): Promise<PaymentAttemptRecord> {
    const data: Record<string, unknown> = { status };

    if (timestamps) {
      if (timestamps.authorizedAt !== undefined) data.authorizedAt = timestamps.authorizedAt;
      if (timestamps.approvedAt !== undefined) data.approvedAt = timestamps.approvedAt;
      if (timestamps.cancelledAt !== undefined) data.cancelledAt = timestamps.cancelledAt;
      if (timestamps.refundedAt !== undefined) data.refundedAt = timestamps.refundedAt;
    }

    const attempt = await prisma.paymentAttempt.update({
      where: { id },
      data
    });

    return mapPaymentAttempt(attempt);
  }

  public async addStatusTransition(
    input: Omit<PaymentStatusTransitionRecord, "id" | "createdAt">
  ): Promise<PaymentStatusTransitionRecord> {
    const transition = await prisma.paymentStatusTransition.create({
      data: {
        paymentAttemptId: input.paymentAttemptId,
        fromStatus: input.fromStatus as import("@prisma/client").PaymentStatus | null,
        toStatus: input.toStatus as import("@prisma/client").PaymentStatus,
        source: input.source,
        sourceReference: input.sourceReference,
        reason: input.reason,
        traceId: input.traceId
      }
    });

    return mapPaymentStatusTransition(transition);
  }
}

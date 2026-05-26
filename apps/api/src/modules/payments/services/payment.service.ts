import { randomUUID, createHash } from "node:crypto";

import { MercadoPagoConfig, Payment, WebhookSignatureValidator } from "mercadopago";

import { env } from "@/config/env.js";
import { ResourceError } from "@/core/errors/resource-error.js";
import { RequestError } from "@/core/errors/request-error.js";
import { PaymentError } from "@/core/errors/payment-error.js";
import { logger } from "@/core/logging/logger.js";
import type {
  PaymentAttemptRecord,
  PaymentWebhookEventRecord,
  IOrderProvider,
  IPaymentAttemptProvider,
  IPaymentWebhookEventProvider,
  OrderRecord
} from "@/providers/contracts-fase4.js";
import type { IAuditProvider } from "@/providers/contracts.js";
import type { CreatePaymentInput } from "@/modules/payments/schemas/payment.schema.js";

type ServiceContext = {
  traceId: string;
  requestId: string;
  userId?: string;
};

export class PaymentService {
  private readonly mpClient: MercadoPagoConfig;
  private readonly paymentClient: Payment;

  public constructor(
    private readonly orderProvider: IOrderProvider,
    private readonly paymentAttemptProvider: IPaymentAttemptProvider,
    private readonly webhookEventProvider: IPaymentWebhookEventProvider,
    private readonly auditProvider: IAuditProvider
  ) {
    this.mpClient = new MercadoPagoConfig({
      accessToken: env.MP_ACCESS_TOKEN
    });
    this.paymentClient = new Payment(this.mpClient);
  }

  public async createPayment(
    input: CreatePaymentInput,
    context: ServiceContext
  ): Promise<PaymentAttemptRecord> {
    const order = await this.orderProvider.findById(input.orderId);
    if (!order) {
      throw new ResourceError("PAYMENT.ORDER_NOT_FOUND", "Order not found.");
    }

    if (order.status !== "PENDING" && order.status !== "WAITING_PAYMENT" && order.status !== "PAYMENT_FAILED") {
      throw new RequestError(
        "PAYMENT.INVALID_ORDER_STATUS",
        `Order status ${order.status} does not accept payments.`
      );
    }

    if ((input.method === "CREDIT_CARD" || input.method === "DEBIT_CARD") && !input.token) {
      throw new RequestError("PAYMENT.TOKEN_REQUIRED", "Card token is required for card payments.");
    }

    const idempotencyKey = randomUUID();

    const attempt = await this.paymentAttemptProvider.create({
      orderId: input.orderId,
      provider: "mercadopago",
      providerPaymentId: null,
      providerOrderId: null,
      idempotencyKey,
      method: input.method,
      status: "CREATED",
      amountCents: order.totalAmountCents,
      currencyCode: order.currencyCode,
      failureCode: null,
      failureMessage: null,
      expiresAt: null,
      authorizedAt: null,
      approvedAt: null,
      cancelledAt: null,
      refundedAt: null
    });

    await this.paymentAttemptProvider.addStatusTransition({
      paymentAttemptId: attempt.id,
      fromStatus: null,
      toStatus: "CREATED",
      source: "SYSTEM",
      sourceReference: null,
      reason: "Payment attempt created",
      traceId: context.traceId
    });

    try {
      const mpBody: Record<string, unknown> = {
        transaction_amount: order.totalAmountCents / 100,
        description: `Pedido #${order.id}`,
        external_reference: order.id,
        metadata: {
          order_id: order.id,
          payment_attempt_id: attempt.id
        },
        payer: {
          email: input.payerEmail,
          ...(input.payerFirstName ? { first_name: input.payerFirstName } : {}),
          ...(input.payerLastName ? { last_name: input.payerLastName } : {}),
          ...(input.identificationType && input.identificationNumber
            ? {
                identification: {
                  type: input.identificationType,
                  number: input.identificationNumber
                }
              }
            : {})
        }
      };

      if (input.method === "PIX") {
        mpBody.payment_method_id = "pix";
      } else {
        mpBody.token = input.token;
        mpBody.installments = input.installments;
      }

      const mpPayment = await this.withRetry(() =>
        this.paymentClient.create({
          body: mpBody as never,
          requestOptions: { idempotencyKey }
        })
      );

      const providerPaymentId = mpPayment.id?.toString() ?? null;
      const providerOrderId = mpPayment.order?.id?.toString() ?? null;
      const internalStatus = this.mapMpStatus(mpPayment.status);

      const timestamps: { authorizedAt?: Date; approvedAt?: Date; cancelledAt?: Date; refundedAt?: Date } = {};
      if (mpPayment.status === "authorized") timestamps.authorizedAt = new Date();
      if (mpPayment.status === "approved") timestamps.approvedAt = new Date();
      if (mpPayment.status === "cancelled") timestamps.cancelledAt = new Date();
      if (mpPayment.status === "refunded") timestamps.refundedAt = new Date();

      const updated = await this.paymentAttemptProvider.updateStatus(
        attempt.id,
        internalStatus,
        timestamps
      );

      const { prisma } = await import("@/providers/prisma.js");
      await prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          providerPaymentId,
          ...(providerOrderId ? { providerOrderId } : {})
        }
      });

      await this.paymentAttemptProvider.addStatusTransition({
        paymentAttemptId: attempt.id,
        fromStatus: "CREATED",
        toStatus: internalStatus,
        source: "MERCADOPAGO_API",
        sourceReference: providerPaymentId,
        reason: mpPayment.status_detail ?? null,
        traceId: context.traceId
      });

      await this.syncOrderStatus(order, internalStatus, context);

      await this.auditProvider.emit({
        eventType: "PAYMENT_CREATED",
        eventCategory: "PAYMENT",
        actorType: context.userId ? "USER" : "SYSTEM",
        ...(context.userId !== undefined && { actorUserId: context.userId }),
        targetType: "PAYMENT_ATTEMPT",
        targetId: attempt.id,
        traceId: context.traceId,
        requestId: context.requestId,
        metadata: { providerPaymentId, method: input.method, status: internalStatus },
        outcome: "SUCCESS"
      });

      return { ...updated, providerPaymentId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await this.paymentAttemptProvider.updateStatus(attempt.id, "REJECTED");
      await this.paymentAttemptProvider.addStatusTransition({
        paymentAttemptId: attempt.id,
        fromStatus: "CREATED",
        toStatus: "REJECTED",
        source: "MERCADOPAGO_API",
        sourceReference: null,
        reason: errorMessage,
        traceId: context.traceId
      });

      await this.orderProvider.updateStatus(order.id, "PAYMENT_FAILED");
      await this.orderProvider.addStatusHistory({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "PAYMENT_FAILED",
        reason: errorMessage,
        actorType: "SYSTEM",
        actorUserId: null,
        traceId: context.traceId
      });

      logger.error({ err: error, orderId: input.orderId, traceId: context.traceId }, "Payment creation failed");

      throw new PaymentError("PAYMENT.CREATION_FAILED", `Payment creation failed: ${errorMessage}`);
    }
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) throw error;
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  public async processWebhook(
    headers: Record<string, string | string[] | undefined>,
    query: Record<string, string | string[] | undefined>,
    rawBody: Buffer,
    context: ServiceContext
  ): Promise<PaymentWebhookEventRecord> {
    const body: Record<string, unknown> = JSON.parse(rawBody.toString("utf-8"));

    let signatureValid = false;
    try {
      WebhookSignatureValidator.validate({
        xSignature: headers["x-signature"] ?? null,
        xRequestId: headers["x-request-id"] ?? null,
        dataId: query["data.id"] ?? null,
        secret: env.MP_WEBHOOK_SECRET,
        toleranceSeconds: 300
      });
      signatureValid = true;
    } catch {
      // Signature validation failed
    }

    // Replay protection: reject events older than 5 minutes
    if (signatureValid) {
      const xSignature = headers["x-signature"];
      const sigString = Array.isArray(xSignature) ? xSignature[0] : xSignature;
      if (sigString) {
        const tsMatch = sigString.match(/ts=(\d+)/);
        if (tsMatch) {
          const eventTimestamp = parseInt(tsMatch[1]!, 10);
          const nowSeconds = Math.floor(Date.now() / 1000);
          if (Math.abs(nowSeconds - eventTimestamp) > 300) {
            logger.warn({ traceId: context.traceId, eventTimestamp }, "Webhook replay detected - event too old");
            const replayEvent = await this.webhookEventProvider.create({
              paymentAttemptId: null,
              providerEventId: (query["data.id"] as string) ?? null,
              providerTopic: (query.type as string) ?? (body.type as string) ?? "payment",
              signatureValidated: true,
              rawBodyHash: createHash("sha256").update(rawBody).digest("hex"),
              processingStatus: "REJECTED_REPLAY",
              traceId: context.traceId
            });
            await this.webhookEventProvider.markProcessed(replayEvent.id, new Date());
            return replayEvent;
          }
        }
      }
    }

    const dataId = query["data.id"] as string | undefined;
    const topic = (query.type as string) ?? (body.type as string) ?? "payment";

    const rawBodyHash = createHash("sha256").update(rawBody).digest("hex");

    const webhookEvent = await this.webhookEventProvider.create({
      paymentAttemptId: null,
      providerEventId: dataId ?? null,
      providerTopic: topic,
      signatureValidated: signatureValid,
      rawBodyHash,
      processingStatus: "PROCESSING",
      traceId: context.traceId
    });

    if (!signatureValid) {
      await this.webhookEventProvider.markProcessed(webhookEvent.id, new Date());
      logger.warn({ traceId: context.traceId, dataId }, "Webhook signature validation failed");
      return { ...webhookEvent, processingStatus: "REJECTED_INVALID_SIGNATURE" };
    }

    if (topic === "payment" && dataId) {
      try {
        await this.processPaymentNotification(dataId, webhookEvent.id, context);
      } catch (error) {
        logger.error({ err: error, dataId, traceId: context.traceId }, "Error processing webhook payment");
      }
    }

    await this.webhookEventProvider.markProcessed(webhookEvent.id, new Date());

    await this.auditProvider.emit({
      eventType: "PAYMENT_WEBHOOK_PROCESSED",
      eventCategory: "PAYMENT",
      actorType: "PROVIDER",
      targetType: "PAYMENT_WEBHOOK_EVENT",
      targetId: webhookEvent.id,
      traceId: context.traceId,
      requestId: context.requestId,
      metadata: { dataId, topic, signatureValid },
      outcome: "SUCCESS"
    });

    return webhookEvent;
  }

  public async getByOrderId(orderId: string): Promise<PaymentAttemptRecord[]> {
    return this.paymentAttemptProvider.findByOrderId(orderId);
  }

  public async getById(id: string): Promise<PaymentAttemptRecord> {
    const payment = await this.paymentAttemptProvider.findById(id);
    if (!payment) {
      throw new ResourceError("PAYMENT.NOT_FOUND", "Payment not found.");
    }
    return payment;
  }

  private async processPaymentNotification(
    mpPaymentId: string,
    webhookEventId: string,
    context: ServiceContext
  ): Promise<void> {
    const mpPayment = await this.withRetry(() =>
      this.paymentClient.get({ id: Number(mpPaymentId) })
    );
    const externalReference = mpPayment.external_reference;

    if (!externalReference) return;

    const order = await this.orderProvider.findById(externalReference);
    if (!order) return;

    const attempts = await this.paymentAttemptProvider.findByOrderId(order.id);
    const matchingAttempt = attempts.find(
      (a) => a.providerPaymentId === mpPaymentId || a.status === "CREATED" || a.status === "PENDING"
    );

    if (!matchingAttempt) return;

    const { prisma } = await import("@/providers/prisma.js");
    await prisma.paymentWebhookEvent.update({
      where: { id: webhookEventId },
      data: { paymentAttemptId: matchingAttempt.id }
    });

    const newStatus = this.mapMpStatus(mpPayment.status);
    const oldStatus = matchingAttempt.status;

    if (newStatus === oldStatus) return;

    const timestamps: { approvedAt?: Date; cancelledAt?: Date; refundedAt?: Date } = {};
    if (mpPayment.status === "approved") timestamps.approvedAt = new Date();
    if (mpPayment.status === "cancelled") timestamps.cancelledAt = new Date();
    if (mpPayment.status === "refunded") timestamps.refundedAt = new Date();

    await this.paymentAttemptProvider.updateStatus(matchingAttempt.id, newStatus, timestamps);

    await this.paymentAttemptProvider.addStatusTransition({
      paymentAttemptId: matchingAttempt.id,
      fromStatus: oldStatus,
      toStatus: newStatus,
      source: "MERCADOPAGO_WEBHOOK",
      sourceReference: mpPaymentId,
      reason: mpPayment.status_detail ?? null,
      traceId: context.traceId
    });

    await this.syncOrderStatus(order, newStatus, context);
  }

  private async syncOrderStatus(
    order: OrderRecord,
    paymentStatus: PaymentAttemptRecord["status"],
    context: ServiceContext
  ): Promise<void> {
    let newOrderStatus: OrderRecord["status"] | null = null;

    switch (paymentStatus) {
      case "APPROVED":
        if (order.status !== "PAID") newOrderStatus = "PAID";
        break;
      case "REJECTED":
        if (order.status !== "PAYMENT_FAILED") newOrderStatus = "PAYMENT_FAILED";
        break;
      case "CANCELLED":
        if (order.status !== "CANCELLED") newOrderStatus = "CANCELLED";
        break;
      case "REFUNDED":
        if (order.status !== "REFUNDED") newOrderStatus = "REFUNDED";
        break;
      case "CHARGEDBACK":
        if (order.status !== "REFUNDED") newOrderStatus = "REFUNDED";
        break;
      case "PENDING":
      case "PROCESSING":
        if (order.status === "PENDING") newOrderStatus = "WAITING_PAYMENT";
        break;
    }

    if (newOrderStatus) {
      await this.orderProvider.updateStatus(order.id, newOrderStatus);
      await this.orderProvider.addStatusHistory({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: newOrderStatus,
        reason: `Payment status: ${paymentStatus}`,
        actorType: "SYSTEM",
        actorUserId: null,
        traceId: context.traceId
      });
    }
  }

  private mapMpStatus(mpStatus: string | undefined): PaymentAttemptRecord["status"] {
    switch (mpStatus) {
      case "approved":
        return "APPROVED";
      case "authorized":
        return "AUTHORIZED";
      case "in_process":
      case "pending":
        return "PENDING";
      case "rejected":
        return "REJECTED";
      case "cancelled":
        return "CANCELLED";
      case "refunded":
        return "REFUNDED";
      case "charged_back":
        return "CHARGEDBACK";
      default:
        return "CREATED";
    }
  }
}

import type { PaymentWebhookEventRecord, IPaymentWebhookEventProvider } from "@/providers/contracts-fase4.js";
import { prisma } from "@/providers/prisma.js";

const mapPaymentWebhookEvent = (event: {
  id: string;
  paymentAttemptId: string | null;
  providerEventId: string | null;
  providerTopic: string | null;
  signatureValidated: boolean;
  rawBodyHash: string | null;
  receivedAt: Date;
  processedAt: Date | null;
  processingStatus: string;
  traceId: string;
}): PaymentWebhookEventRecord => ({
  id: event.id,
  paymentAttemptId: event.paymentAttemptId,
  providerEventId: event.providerEventId,
  providerTopic: event.providerTopic,
  signatureValidated: event.signatureValidated,
  rawBodyHash: event.rawBodyHash,
  receivedAt: event.receivedAt,
  processedAt: event.processedAt,
  processingStatus: event.processingStatus,
  traceId: event.traceId
});

export class PrismaPaymentWebhookEventProvider implements IPaymentWebhookEventProvider {
  public async create(
    input: Omit<PaymentWebhookEventRecord, "id" | "receivedAt" | "processedAt">
  ): Promise<PaymentWebhookEventRecord> {
    const event = await prisma.paymentWebhookEvent.create({
      data: {
        paymentAttemptId: input.paymentAttemptId,
        providerEventId: input.providerEventId,
        providerTopic: input.providerTopic,
        signatureValidated: input.signatureValidated,
        rawBodyHash: input.rawBodyHash,
        processingStatus: input.processingStatus,
        traceId: input.traceId
      }
    });

    return mapPaymentWebhookEvent(event);
  }

  public async findByProviderEventId(providerEventId: string): Promise<PaymentWebhookEventRecord | null> {
    const event = await prisma.paymentWebhookEvent.findFirst({
      where: { providerEventId }
    });
    return event ? mapPaymentWebhookEvent(event) : null;
  }

  public async markProcessed(id: string, processedAt: Date): Promise<void> {
    await prisma.paymentWebhookEvent.update({
      where: { id },
      data: {
        processedAt,
        processingStatus: "PROCESSED"
      }
    });
  }
}

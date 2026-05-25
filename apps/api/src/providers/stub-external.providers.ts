import type {
  IEmailProvider,
  IPaymentProvider,
  IShippingProvider,
  IStorageProvider,
  ISseProvider,
  SseConnection
} from "@/providers/contracts.js";

export class StubStorageProvider implements IStorageProvider {
  public async upload(): Promise<string> {
    throw new Error("Storage provider is not configured for this phase.");
  }

  public async delete(): Promise<void> {
    throw new Error("Storage provider is not configured for this phase.");
  }

  public async getSignedUrl(): Promise<string> {
    throw new Error("Storage provider is not configured for this phase.");
  }

  public async exists(): Promise<boolean> {
    return false;
  }
}

export class StubEmailProvider implements IEmailProvider {
  public async sendTransactional(): Promise<void> {
    throw new Error("Email provider is not configured for this phase.");
  }

  public async sendTemplate(): Promise<void> {
    throw new Error("Email provider is not configured for this phase.");
  }
}

export class StubPaymentProvider implements IPaymentProvider {
  public async createCheckout(): Promise<Record<string, unknown>> {
    throw new Error("Payment provider is not configured for this phase.");
  }

  public async getPayment(): Promise<Record<string, unknown>> {
    throw new Error("Payment provider is not configured for this phase.");
  }

  public async refundPayment(): Promise<Record<string, unknown>> {
    throw new Error("Payment provider is not configured for this phase.");
  }

  public async validateWebhookSignature(): Promise<boolean> {
    return false;
  }
}

export class StubShippingProvider implements IShippingProvider {
  public async calculateShipping(): Promise<Record<string, unknown>> {
    throw new Error("Shipping provider is not configured for this phase.");
  }

  public async validateZipCode(): Promise<boolean> {
    return false;
  }
}

export class NativeSseProvider implements ISseProvider {
  public async connect(_connection: SseConnection): Promise<void> {
    return;
  }

  public async disconnect(_connectionId: string): Promise<void> {
    return;
  }

  public async publish(_channel: string, _payload: Record<string, unknown>): Promise<void> {
    return;
  }

  public async broadcast(_scope: SseConnection["scope"], _payload: Record<string, unknown>): Promise<void> {
    return;
  }

  public async authenticateConnection(_sessionId: string): Promise<boolean> {
    return true;
  }
}

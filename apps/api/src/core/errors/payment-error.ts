import { BaseAppError } from "@/core/errors/base-app-error.js";

export class PaymentError extends BaseAppError {
  public constructor(code: string, message: string, details?: Record<string, unknown>) {
    super({ code, message, statusCode: 422, details, exposeDetails: true });
    this.name = "PaymentError";
  }
}

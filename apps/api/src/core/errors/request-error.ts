import { BaseAppError } from "@/core/errors/base-app-error.js";

export class RequestError extends BaseAppError {
  public constructor(code: string, message: string, details?: Record<string, unknown>) {
    super({ code, message, details, statusCode: 400, exposeDetails: true });
  }
}

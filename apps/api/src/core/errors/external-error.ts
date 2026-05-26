import { BaseAppError } from "@/core/errors/base-app-error.js";

export class ExternalError extends BaseAppError {
  public constructor(code: string, message: string, details?: Record<string, unknown>) {
    super({ code, message, statusCode: 502, details, exposeDetails: true });
    this.name = "ExternalError";
  }
}

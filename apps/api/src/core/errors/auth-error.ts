import { BaseAppError } from "@/core/errors/base-app-error.js";

export class AuthError extends BaseAppError {
  public constructor(code: string, message: string, details?: Record<string, unknown>) {
    super({ code, message, details, statusCode: 401 });
  }
}

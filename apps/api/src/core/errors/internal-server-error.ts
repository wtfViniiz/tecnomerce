import { BaseAppError } from "@/core/errors/base-app-error.js";

export class InternalServerError extends BaseAppError {
  public constructor(message = "Unexpected internal server error.") {
    super({ code: "SERVER.INTERNAL_ERROR", message, statusCode: 500 });
  }
}

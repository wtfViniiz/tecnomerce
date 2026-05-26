import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";
import type { CheckoutService } from "@/modules/checkout/services/checkout.service.js";

export class CheckoutController {
  public constructor(private readonly checkoutService: CheckoutService) {}

  public checkout = async (request: Request, response: Response): Promise<void> => {
    const result = await this.checkoutService.checkout(request.body, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      userId: request.context.userId!
    });
    response.status(201).json(successResponse(request.context.traceId, result));
  };
}

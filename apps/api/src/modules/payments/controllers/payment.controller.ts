import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";
import type { PaymentService } from "@/modules/payments/services/payment.service.js";

export class PaymentController {
  public constructor(private readonly paymentService: PaymentService) {}

  public create = async (request: Request, response: Response): Promise<void> => {
    const payment = await this.paymentService.createPayment(request.body, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.status(201).json(successResponse(request.context.traceId, payment));
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const payment = await this.paymentService.getById(request.params.id as string);
    response.json(successResponse(request.context.traceId, payment));
  };

  public getByOrderId = async (request: Request, response: Response): Promise<void> => {
    const payments = await this.paymentService.getByOrderId(request.params.orderId as string);
    response.json(successResponse(request.context.traceId, payments));
  };

  public webhook = async (request: Request, response: Response): Promise<void> => {
    await this.paymentService.processWebhook(
      request.headers as Record<string, string | string[] | undefined>,
      request.query as Record<string, string | string[] | undefined>,
      request.body as Record<string, unknown>,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId
      }
    );

    // Always return 200 to MP to acknowledge receipt
    response.status(200).json({ received: true });
  };
}

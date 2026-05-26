import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";
import type { OrderService } from "@/modules/orders/services/order.service.js";

export class OrderController {
  public constructor(private readonly orderService: OrderService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const userId = request.context.userId;
    if (!userId) {
      response.status(401).json(successResponse(request.context.traceId, null));
      return;
    }

    const orders = await this.orderService.listByUserId(userId);
    response.json(successResponse(request.context.traceId, orders));
  };

  public listAdmin = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as {
      status?: string;
      page?: string;
      limit?: string;
    };

    const listOptions: { status?: string; page?: number; limit?: number } = {};
    if (query.status !== undefined) listOptions.status = query.status;
    if (query.page !== undefined) listOptions.page = Number(query.page);
    if (query.limit !== undefined) listOptions.limit = Number(query.limit);

    const result = await this.orderService.list(listOptions);

    response.json(successResponse(request.context.traceId, result));
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const detail = await this.orderService.getDetail(request.params.id as string);
    response.json(successResponse(request.context.traceId, detail));
  };

  public cancel = async (request: Request, response: Response): Promise<void> => {
    const order = await this.orderService.cancel(
      request.params.id as string,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined && { userId: request.context.userId })
      },
      request.body?.reason
    );

    response.json(successResponse(request.context.traceId, order));
  };
}

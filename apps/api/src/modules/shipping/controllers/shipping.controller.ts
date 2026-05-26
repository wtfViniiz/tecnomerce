import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";
import type { ShippingService } from "@/modules/shipping/services/shipping.service.js";

export class ShippingController {
  public constructor(private readonly shippingService: ShippingService) {}

  public calculate = async (request: Request, response: Response): Promise<void> => {
    const result = await this.shippingService.calculate(request.body);
    response.json(successResponse(request.context.traceId, result));
  };

  public listMethods = async (request: Request, response: Response): Promise<void> => {
    const methods = await this.shippingService.listMethods();
    response.json(successResponse(request.context.traceId, methods));
  };

  public listRules = async (request: Request, response: Response): Promise<void> => {
    const rules = await this.shippingService.listRules(request.params.id as string);
    response.json(successResponse(request.context.traceId, rules));
  };
}

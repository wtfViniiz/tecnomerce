import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";
import type { CouponService } from "@/modules/coupons/services/coupon.service.js";

export class CouponController {
  public constructor(private readonly couponService: CouponService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const coupons = await this.couponService.list();
    response.json(successResponse(request.context.traceId, coupons));
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const coupon = await this.couponService.getById(request.params.id as string);
    response.json(successResponse(request.context.traceId, coupon));
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const coupon = await this.couponService.create(request.body, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.status(201).json(successResponse(request.context.traceId, coupon));
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const coupon = await this.couponService.update(request.params.id as string, request.body, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.json(successResponse(request.context.traceId, coupon));
  };

  public softDelete = async (request: Request, response: Response): Promise<void> => {
    await this.couponService.softDelete(request.params.id as string, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.status(204).send();
  };

  public validate = async (request: Request, response: Response): Promise<void> => {
    const { code, orderAmountCents } = request.body;
    const userId = request.context.userId as string;

    const coupon = await this.couponService.validateForOrder(code, userId, orderAmountCents);
    response.json(successResponse(request.context.traceId, coupon));
  };
}

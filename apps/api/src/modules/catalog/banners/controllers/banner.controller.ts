import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";
import type { BannerService } from "@/modules/catalog/banners/services/banner.service.js";

export class BannerController {
  public constructor(private readonly bannerService: BannerService) {}

  public listActive = async (request: Request, response: Response): Promise<void> => {
    const banners = await this.bannerService.listActive();
    response.json(successResponse(request.context.traceId, banners));
  };

  public listAll = async (request: Request, response: Response): Promise<void> => {
    const banners = await this.bannerService.listAll();
    response.json(successResponse(request.context.traceId, banners));
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const banner = await this.bannerService.getById(request.params.id as string);
    response.json(successResponse(request.context.traceId, banner));
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const banner = await this.bannerService.create(request.body, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.status(201).json(successResponse(request.context.traceId, banner));
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const banner = await this.bannerService.update(request.params.id as string, request.body, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.json(successResponse(request.context.traceId, banner));
  };

  public softDelete = async (request: Request, response: Response): Promise<void> => {
    await this.bannerService.softDelete(request.params.id as string, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.status(204).send();
  };
}

import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";
import type { MediaService } from "@/modules/catalog/media/services/media.service.js";

export class MediaController {
  public constructor(private readonly mediaService: MediaService) {}

  public listByProduct = async (request: Request, response: Response): Promise<void> => {
    const media = await this.mediaService.listByProductId(request.params.productId as string);
    response.json(successResponse(request.context.traceId, media));
  };

  public register = async (request: Request, response: Response): Promise<void> => {
    const media = await this.mediaService.register(
      request.params.productId as string,
      request.body,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined && { userId: request.context.userId })
      }
    );

    response.status(201).json(successResponse(request.context.traceId, media));
  };

  public presignUpload = async (request: Request, response: Response): Promise<void> => {
    const result = await this.mediaService.presignUpload(
      request.params.productId as string,
      request.body,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined && { userId: request.context.userId })
      }
    );

    response.json(successResponse(request.context.traceId, result));
  };

  public reorder = async (request: Request, response: Response): Promise<void> => {
    await this.mediaService.reorder(
      request.params.productId as string,
      request.body.orderedIds,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined && { userId: request.context.userId })
      }
    );

    response.json(successResponse(request.context.traceId, { reordered: true }));
  };

  public softDelete = async (request: Request, response: Response): Promise<void> => {
    await this.mediaService.softDelete(
      request.params.productId as string,
      request.params.mediaId as string,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined && { userId: request.context.userId })
      }
    );

    response.status(204).send();
  };
}

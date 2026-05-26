import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";
import type { FavoriteService } from "@/modules/favorites/services/favorite.service.js";

export class FavoriteController {
  public constructor(private readonly favoriteService: FavoriteService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const favorites = await this.favoriteService.listByUserId(request.context.userId!);
    response.json(successResponse(request.context.traceId, favorites));
  };

  public add = async (request: Request, response: Response): Promise<void> => {
    const favorite = await this.favoriteService.add(
      request.context.userId!,
      request.body,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined && { userId: request.context.userId })
      }
    );

    response.status(201).json(successResponse(request.context.traceId, favorite));
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await this.favoriteService.remove(
      request.context.userId!,
      request.params.productId as string,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined && { userId: request.context.userId })
      }
    );

    response.status(204).send();
  };

  public toggle = async (request: Request, response: Response): Promise<void> => {
    const result = await this.favoriteService.toggle(
      request.context.userId!,
      request.body,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined && { userId: request.context.userId })
      }
    );

    response.json(successResponse(request.context.traceId, result));
  };
}

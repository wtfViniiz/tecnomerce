import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";
import type { CategoryService } from "@/modules/catalog/categories/services/category.service.js";

export class CategoryController {
  public constructor(private readonly categoryService: CategoryService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const categories = await this.categoryService.list();
    response.json(successResponse(request.context.traceId, categories));
  };

  public listAll = async (request: Request, response: Response): Promise<void> => {
    const categories = await this.categoryService.listAll();
    response.json(successResponse(request.context.traceId, categories));
  };

  public getBySlug = async (request: Request, response: Response): Promise<void> => {
    const category = await this.categoryService.getBySlug(request.params.slug as string);
    response.json(successResponse(request.context.traceId, category));
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const category = await this.categoryService.create(request.body, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.status(201).json(successResponse(request.context.traceId, category));
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const category = await this.categoryService.update(request.params.id as string, request.body, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.json(successResponse(request.context.traceId, category));
  };

  public softDelete = async (request: Request, response: Response): Promise<void> => {
    await this.categoryService.softDelete(request.params.id as string, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.status(204).send();
  };
}

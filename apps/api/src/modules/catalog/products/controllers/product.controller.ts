import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";
import type { ProductService } from "@/modules/catalog/products/services/product.service.js";

export class ProductController {
  public constructor(private readonly productService: ProductService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.productService.list(request.query as any);
    response.json(successResponse(request.context.traceId, result));
  };

  public listPublished = async (request: Request, response: Response): Promise<void> => {
    const result = await this.productService.listPublished(request.query as any);
    response.json(successResponse(request.context.traceId, result));
  };

  public getBySlug = async (request: Request, response: Response): Promise<void> => {
    const product = await this.productService.getBySlug(request.params.slug as string);
    response.json(successResponse(request.context.traceId, product));
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const product = await this.productService.create(request.body, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.status(201).json(successResponse(request.context.traceId, product));
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const product = await this.productService.update(request.params.id as string, request.body, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.json(successResponse(request.context.traceId, product));
  };

  public publish = async (request: Request, response: Response): Promise<void> => {
    const product = await this.productService.publish(request.params.id as string, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.json(successResponse(request.context.traceId, product));
  };

  public archive = async (request: Request, response: Response): Promise<void> => {
    const product = await this.productService.archive(request.params.id as string, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.json(successResponse(request.context.traceId, product));
  };

  public softDelete = async (request: Request, response: Response): Promise<void> => {
    await this.productService.softDelete(request.params.id as string, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.status(204).send();
  };
}

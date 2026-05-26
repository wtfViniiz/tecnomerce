import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";
import type { AddressService } from "@/modules/addresses/services/address.service.js";

export class AddressController {
  public constructor(private readonly addressService: AddressService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const addresses = await this.addressService.listByUserId(request.context.userId as string);
    response.json(successResponse(request.context.traceId, addresses));
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const address = await this.addressService.getById(request.params.id as string);
    response.json(successResponse(request.context.traceId, address));
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const address = await this.addressService.create(request.body, request.context.userId as string, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.status(201).json(successResponse(request.context.traceId, address));
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const address = await this.addressService.update(
      request.params.id as string,
      request.body,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined && { userId: request.context.userId })
      }
    );

    response.json(successResponse(request.context.traceId, address));
  };

  public softDelete = async (request: Request, response: Response): Promise<void> => {
    await this.addressService.softDelete(request.params.id as string, {
      traceId: request.context.traceId,
      requestId: request.context.requestId,
      ...(request.context.userId !== undefined && { userId: request.context.userId })
    });

    response.status(204).send();
  };

  public setDefault = async (request: Request, response: Response): Promise<void> => {
    await this.addressService.setDefault(
      request.params.id as string,
      request.context.userId as string,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined && { userId: request.context.userId })
      }
    );

    response.json(successResponse(request.context.traceId, { success: true }));
  };
}

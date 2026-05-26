import type { Request, Response } from "express";

import { successResponse } from "@/core/api/api-envelope.js";
import type { CartService } from "@/modules/cart/services/cart.service.js";

export class CartController {
  public constructor(private readonly cartService: CartService) {}

  public getActive = async (request: Request, response: Response): Promise<void> => {
    const cart = await this.cartService.getActiveCart(
      request.context.userId,
      request.query.guestToken as string | undefined
    );
    response.json(successResponse(request.context.traceId, cart));
  };

  public addItem = async (request: Request, response: Response): Promise<void> => {
    const item = await this.cartService.addItem(
      request.body,
      request.context.userId,
      request.body.guestToken,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined ? { userId: request.context.userId } : {})
      }
    );
    response.status(201).json(successResponse(request.context.traceId, item));
  };

  public updateItemQuantity = async (request: Request, response: Response): Promise<void> => {
    const item = await this.cartService.updateItemQuantity(
      request.params.itemId as string,
      request.body,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined ? { userId: request.context.userId } : {})
      }
    );
    response.json(successResponse(request.context.traceId, item));
  };

  public removeItem = async (request: Request, response: Response): Promise<void> => {
    await this.cartService.removeItem(
      request.params.itemId as string,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined ? { userId: request.context.userId } : {})
      }
    );
    response.status(204).send();
  };

  public clearCart = async (request: Request, response: Response): Promise<void> => {
    await this.cartService.clearCart(
      request.params.cartId as string,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        ...(request.context.userId !== undefined ? { userId: request.context.userId } : {})
      }
    );
    response.status(204).send();
  };

  public mergeGuestCart = async (request: Request, response: Response): Promise<void> => {
    const cart = await this.cartService.mergeGuestCart(
      request.body.guestToken,
      request.context.userId!,
      {
        traceId: request.context.traceId,
        requestId: request.context.requestId,
        userId: request.context.userId!
      }
    );
    response.json(successResponse(request.context.traceId, cart));
  };

  public generateGuestToken = async (request: Request, response: Response): Promise<void> => {
    const token = await this.cartService.generateGuestToken();
    response.json(successResponse(request.context.traceId, { guestToken: token }));
  };
}

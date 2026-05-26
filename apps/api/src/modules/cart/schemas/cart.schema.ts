import { z } from "zod";

export const addItemSchema = z.object({
  productVariantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  guestToken: z.string().min(1).optional(),
  customName: z.string().max(100).optional(),
  customNumber: z.string().max(20).optional(),
  customNotes: z.string().max(500).optional(),
  customizationPriceCents: z.number().int().min(0).optional()
});

export const updateItemQuantitySchema = z.object({
  quantity: z.number().int().min(1).max(99)
});

export const cartIdParamSchema = z.object({
  cartId: z.string().uuid()
});

export const cartItemIdParamSchema = z.object({
  itemId: z.string().uuid()
});

export const mergeGuestCartSchema = z.object({
  guestToken: z.string().min(1)
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateItemQuantityInput = z.infer<typeof updateItemQuantitySchema>;
export type MergeGuestCartInput = z.infer<typeof mergeGuestCartSchema>;

import { z } from "zod";

export const addFavoriteSchema = z.object({
  productId: z.string().uuid()
});

export const removeFavoriteParamSchema = z.object({
  productId: z.string().uuid()
});

export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;

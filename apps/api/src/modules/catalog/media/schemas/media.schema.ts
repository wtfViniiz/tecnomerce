import { z } from "zod";

export const registerMediaSchema = z.object({
  storageKey: z.string().min(1).max(1000),
  cdnUrl: z.string().url().max(2000),
  altText: z.string().max(500).optional(),
  position: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional()
});

export const reorderMediaSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1)
});

export const presignMediaSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255)
});

export const productIdParamSchema = z.object({
  productId: z.string().uuid()
});

export const mediaIdParamSchema = z.object({
  productId: z.string().uuid(),
  mediaId: z.string().uuid()
});

export type RegisterMediaInput = z.infer<typeof registerMediaSchema>;
export type ReorderMediaInput = z.infer<typeof reorderMediaSchema>;
export type PresignMediaInput = z.infer<typeof presignMediaSchema>;

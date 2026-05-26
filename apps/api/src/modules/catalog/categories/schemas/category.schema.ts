import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  sortOrder: z.number().int().min(0).optional()
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(2000).optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const categorySlugParamSchema = z.object({
  slug: z.string().min(1)
});

export const categoryIdParamSchema = z.object({
  id: z.string().uuid()
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

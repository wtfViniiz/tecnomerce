import { z } from "zod";

const variantSchema = z.object({
  sku: z.string().min(1).max(100),
  fabricId: z.string().uuid(),
  sizeOptionId: z.string().uuid(),
  colorOptionId: z.string().uuid(),
  basePriceCents: z.number().int().min(0),
  promotionalPriceCents: z.number().int().min(0).optional()
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  categoryId: z.string().uuid(),
  isCustomizable: z.boolean().optional(),
  couponEligible: z.boolean().optional(),
  productionTimeDays: z.number().int().min(0).optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
  variants: z.array(variantSchema).min(1)
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(5000).optional(),
  categoryId: z.string().uuid().optional(),
  isCustomizable: z.boolean().optional(),
  couponEligible: z.boolean().optional(),
  productionTimeDays: z.number().int().min(0).optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional()
});

export const productListQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export const productSlugParamSchema = z.object({
  slug: z.string().min(1)
});

export const productIdParamSchema = z.object({
  id: z.string().uuid()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

import { z } from "zod";

export const calculateShippingSchema = z.object({
  postalCode: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "Postal code must be 8 digits (e.g., 12345-678 or 12345678)"),
  subtotalCents: z.number().int().min(0)
});

export const createShippingMethodSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  type: z.enum(["FLAT_RATE", "WEIGHT_BASED", "FREE", "ZONE_BASED"]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
});

export const updateShippingMethodSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  type: z.enum(["FLAT_RATE", "WEIGHT_BASED", "FREE", "ZONE_BASED"]).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const createShippingRuleSchema = z.object({
  shippingMethodId: z.string().uuid(),
  postalCodeStart: z.string().length(8),
  postalCodeEnd: z.string().length(8),
  priceCents: z.number().int().min(0),
  currencyCode: z.string().min(3).max(3).default("BRL"),
  estimatedMinDays: z.number().int().positive(),
  estimatedMaxDays: z.number().int().positive(),
  minimumOrderAmountCents: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true)
});

export const updateShippingRuleSchema = z.object({
  postalCodeStart: z.string().length(8).optional(),
  postalCodeEnd: z.string().length(8).optional(),
  priceCents: z.number().int().min(0).optional(),
  currencyCode: z.string().min(3).max(3).optional(),
  estimatedMinDays: z.number().int().positive().optional(),
  estimatedMaxDays: z.number().int().positive().optional(),
  minimumOrderAmountCents: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

export const shippingMethodIdParamSchema = z.object({
  id: z.string().uuid()
});

export const shippingRuleIdParamSchema = z.object({
  id: z.string().uuid()
});

export type CalculateShippingInput = z.infer<typeof calculateShippingSchema>;
export type CreateShippingMethodInput = z.infer<typeof createShippingMethodSchema>;
export type UpdateShippingMethodInput = z.infer<typeof updateShippingMethodSchema>;
export type CreateShippingRuleInput = z.infer<typeof createShippingRuleSchema>;
export type UpdateShippingRuleInput = z.infer<typeof updateShippingRuleSchema>;

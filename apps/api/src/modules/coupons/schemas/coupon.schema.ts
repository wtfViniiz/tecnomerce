import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/, "Code must contain only uppercase letters, numbers and dashes"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  valueCentsOrPercentage: z.number().positive(),
  currencyCode: z.string().length(3).default("BRL"),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED", "ARCHIVED"]).default("DRAFT"),
  maxUses: z.number().int().positive().optional(),
  maxUsesPerUser: z.number().int().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  minimumOrderAmountCents: z.number().int().min(0).optional(),
  isStackable: z.boolean().default(false)
}).refine(
  (data) => data.type !== "PERCENTAGE" || data.valueCentsOrPercentage <= 100,
  { message: "Percentage value must be at most 100", path: ["valueCentsOrPercentage"] }
);

export const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/, "Code must contain only uppercase letters, numbers and dashes").optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  valueCentsOrPercentage: z.number().positive().optional(),
  currencyCode: z.string().length(3).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED", "ARCHIVED"]).optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  minimumOrderAmountCents: z.number().int().min(0).optional().nullable(),
  isStackable: z.boolean().optional()
});

export const couponIdParamSchema = z.object({
  id: z.string().uuid()
});

export const couponCodeParamSchema = z.object({
  code: z.string().min(1)
});

export const validateCouponBodySchema = z.object({
  code: z.string().min(1),
  orderAmountCents: z.number().int().positive()
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponBodySchema>;

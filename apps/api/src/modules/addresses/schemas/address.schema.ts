import { z } from "zod";

export const createAddressSchema = z.object({
  label: z.string().max(100).optional(),
  recipientName: z.string().min(1).max(255),
  phone: z.string().max(20).optional(),
  postalCode: z
    .string()
    .min(8)
    .max(9)
    .regex(/^\d{5}-?\d{3}$/, "Invalid postal code format"),
  street: z.string().min(1).max(255),
  number: z.string().min(1).max(20),
  complement: z.string().max(255).optional(),
  neighborhood: z.string().min(1).max(255),
  city: z.string().min(1).max(255),
  state: z.string().length(2),
  countryCode: z.string().max(2).default("BR"),
  addressType: z.enum(["RESIDENTIAL", "COMMERCIAL"]).default("RESIDENTIAL"),
  isDefault: z.boolean().default(false)
});

export const updateAddressSchema = z.object({
  label: z.string().max(100).optional(),
  recipientName: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional(),
  postalCode: z
    .string()
    .min(8)
    .max(9)
    .regex(/^\d{5}-?\d{3}$/, "Invalid postal code format")
    .optional(),
  street: z.string().min(1).max(255).optional(),
  number: z.string().min(1).max(20).optional(),
  complement: z.string().max(255).optional(),
  neighborhood: z.string().min(1).max(255).optional(),
  city: z.string().min(1).max(255).optional(),
  state: z.string().length(2).optional(),
  countryCode: z.string().max(2).optional(),
  addressType: z.enum(["RESIDENTIAL", "COMMERCIAL"]).optional(),
  isDefault: z.boolean().optional()
});

export const addressIdParamSchema = z.object({
  id: z.string().min(1)
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

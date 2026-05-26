import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.string().uuid(),
  shippingMethodId: z.string().uuid(),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD"]),
  couponCode: z.string().optional(),
  // For credit/debit card
  cardToken: z.string().optional(),
  installments: z.number().int().min(1).max(12).optional(),
  issuerId: z.string().optional(),
  guestToken: z.string().optional()
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD"]),
  token: z.string().min(1).optional(),
  installments: z.number().int().min(1).max(12).default(1),
  payerEmail: z.string().email(),
  payerFirstName: z.string().min(1).max(100).optional(),
  payerLastName: z.string().min(1).max(100).optional(),
  identificationType: z.enum(["CPF", "CNPJ"]).optional(),
  identificationNumber: z.string().min(11).max(14).optional()
});

export const paymentIdParamSchema = z.object({
  id: z.string().uuid()
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

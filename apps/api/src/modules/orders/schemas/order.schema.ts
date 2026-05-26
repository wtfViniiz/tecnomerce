import { z } from "zod";

export const orderIdParamSchema = z.object({
  id: z.string().uuid()
});

export const listOrdersQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

import { z } from "zod";

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1)
});

export const revokeSessionBodySchema = z.object({
  confirmCurrentSession: z.boolean().optional()
});

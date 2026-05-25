import { z } from "zod";

export const verifyTwoFaSchema = z.object({
  token: z.string().min(6).max(128)
});

export const disableTwoFaSchema = z.object({
  currentPassword: z.string().min(8),
  token: z.string().min(6).max(128)
});

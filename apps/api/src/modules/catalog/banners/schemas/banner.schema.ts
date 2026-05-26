import { z } from "zod";

export const createBannerSchema = z.object({
  title: z.string().min(1).max(255),
  subtitle: z.string().max(500).optional(),
  ctaLabel: z.string().max(100).optional(),
  ctaHref: z.string().url().max(2000).optional(),
  desktopMediaKey: z.string().max(500).optional(),
  mobileMediaKey: z.string().max(500).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const updateBannerSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  subtitle: z.string().max(500).optional(),
  ctaLabel: z.string().max(100).optional(),
  ctaHref: z.string().url().max(2000).optional(),
  desktopMediaKey: z.string().max(500).optional(),
  mobileMediaKey: z.string().max(500).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const bannerIdParamSchema = z.object({
  id: z.string().uuid()
});

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;

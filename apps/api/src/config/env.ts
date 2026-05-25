import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  APP_ENV: z.string().min(1).default("dev"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  REFRESH_TOKEN_SECRET: z.string().min(1),
  TWO_FA_ENCRYPTION_KEY: z.string().min(1),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  STEP_UP_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  PERMISSION_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  SESSION_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_METADATA_TTL_SECONDS: z.coerce.number().int().positive().default(2592000)
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

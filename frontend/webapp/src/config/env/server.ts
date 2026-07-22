// @/config/env/server.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const env = createEnv({
  server: {
    INTERNAL_API_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    WEBHOOK_KEY: z.string().min(1),
    PROVIDER_PORTAL_ORIGIN: z.string().url().optional(),
    PROVIDER_PORTAL_SSO_SECRET: z.string().min(32).optional(),
  },
  experimental__runtimeEnv: {
    INTERNAL_API_URL: process.env.INTERNAL_API_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    WEBHOOK_KEY: process.env.WEBHOOK_KEY,
    PROVIDER_PORTAL_ORIGIN: process.env.PROVIDER_PORTAL_ORIGIN,
    PROVIDER_PORTAL_SSO_SECRET: process.env.PROVIDER_PORTAL_SSO_SECRET,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION || process.env.NODE_ENV === "test",
});
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const env = createEnv({
  server: {
    WEBHOOK_KEY: z.string().min(1),
    INTERNAL_API_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
  },
  experimental__runtimeEnv: process.env,
});

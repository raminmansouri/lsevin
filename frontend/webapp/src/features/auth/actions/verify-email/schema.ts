import { z } from "zod/v4";

export const VerifyEmailSchema = z.object({
  email: z.email(),
  code: z.string().min(1),
});

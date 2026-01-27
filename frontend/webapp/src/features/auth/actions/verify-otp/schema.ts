import * as z from "zod/v4";

export const VerifyOtpSchema = z.object({
  code: z.string().min(6).max(6),
  phoneNumber: z.string().min(1),
  redirectTo: z.string().optional(),
});

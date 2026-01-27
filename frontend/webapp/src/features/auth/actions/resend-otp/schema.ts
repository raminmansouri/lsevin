import * as z from "zod/v4";

export const ResendOtpSchema = z.object({
  phoneNumber: z.string().min(1),
});

import * as z from "zod/v4";

export const SendOtpSchema = z.object({
  // No input needed - uses authenticated user's phone number
});

import * as z from "zod/v4";

export const ForgotPasswordSchema = z.object({
  userNameOrEmail: z.string().trim().min(1),
});

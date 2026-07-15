import * as z from "zod/v4";

export const ResetPasswordSchema = z
  .object({
    userNameOrEmail: z.string().trim().min(1),
    code: z.string().trim().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
    params: { code: "not_match" },
  });

import { z } from "zod/v4";

import { phoneNumberSchema } from "@/features/shared/types/schemas";

export const SignUpSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    userName: z.string().optional(),
    email: z.email(),
    phoneNumber: phoneNumberSchema,
    password: z.string().min(6),
    confirmPassword: z.string().optional(),
    // Optional on purpose: an invite code is a bonus, never a barrier to
    // registering. Validated against the programme after the phone is verified.
    referralCode: z.string().trim().max(64).optional(),
  })
  .refine(
    (data) => {
      if (data.phoneNumber) {
        data.userName = data.phoneNumber;
      }
      if (data.password) {
        data.confirmPassword = data.password;
      }
      return data.password === data.confirmPassword;
    },
    {
      path: ["confirmPassword"],
      message: "Passwords do not match",
      params: { code: "not_match" },
    }
  );

import { z } from "zod/v4";

import { phoneNumberSchema } from "@/features/shared/types/schemas";

// Main schema for update base info
export const UpdateBaseInfoSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phoneNumber: phoneNumberSchema,
});

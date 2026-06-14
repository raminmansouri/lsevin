import { z } from "zod/v4";

// Mobile number is the immutable identity key of the account.
// Do not accept phone fields in the profile-edit payload.
export const UpdateBaseInfoSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
});

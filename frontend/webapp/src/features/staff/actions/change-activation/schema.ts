import { z } from "zod/v4";

export const ChangeStaffActivationSchema = z.object({
  staffId: z.guid(),
  isActive: z.boolean(),
});

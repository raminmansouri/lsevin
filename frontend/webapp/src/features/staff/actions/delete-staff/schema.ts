import { z } from "zod/v4";

export const DeleteStaffSchema = z.object({
  staffId: z.guid(),
});

export type DeleteStaffInput = z.infer<typeof DeleteStaffSchema>;

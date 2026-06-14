import { z } from "zod/v4";

import { StaffServiceCreateSchema } from "../../schemas";

export const AddStaffServiceSchema = StaffServiceCreateSchema.extend({
  staffId: z.guid(),
});

export type AddStaffServiceFormData = z.infer<typeof AddStaffServiceSchema>;

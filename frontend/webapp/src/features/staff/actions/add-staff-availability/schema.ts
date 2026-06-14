import { z } from "zod/v4";

import { StaffAvailabilityCreateSchema } from "../../schemas";

export const AddStaffAvailabilitySchema = StaffAvailabilityCreateSchema.extend({
  staffId: z.guid(),
});

export type AddStaffAvailabilityFormData = z.infer<
  typeof AddStaffAvailabilitySchema
>;

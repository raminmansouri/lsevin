import { z } from "zod/v4";

import { StaffAvailabilityUpdateSchema } from "../../schemas";

export const UpdateStaffAvailabilitySchema =
  StaffAvailabilityUpdateSchema.extend({
    staffId: z.guid(),
  });

export type UpdateStaffAvailabilityFormData = z.infer<
  typeof UpdateStaffAvailabilitySchema
>;

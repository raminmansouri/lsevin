import { z } from "zod/v4";

import { StaffAvailabilityDeleteSchema } from "../../schemas";

export const RemoveStaffAvailabilitySchema = StaffAvailabilityDeleteSchema;

export type RemoveStaffAvailabilityInput = z.infer<
  typeof RemoveStaffAvailabilitySchema
>;

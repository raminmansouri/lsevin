import { z } from "zod/v4";

import { StaffServiceUpdateSchema } from "../../schemas";

export const UpdateStaffServiceSchema = StaffServiceUpdateSchema.extend({
  staffId: z.guid(),
});

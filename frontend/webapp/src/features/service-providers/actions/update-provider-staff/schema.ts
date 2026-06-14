import { z } from "zod/v4";

import { OptionalLocalizedContentSchema } from "@/features/shared/schemas/localization";

export const UpdateProviderStaffSchema = z.object({
  serviceProviderId: z.guid(),
  staffId: z.guid(),
  notes: OptionalLocalizedContentSchema.optional(),
  isActive: z.boolean(),
  newStaffId: z.guid().optional(),
});

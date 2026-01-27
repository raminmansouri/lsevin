import { z } from "zod/v4";

import { OptionalLocalizedContentSchema } from "@/features/shared/schemas/localization";

export const AddProviderStaffSchema = z.object({
  serviceProviderId: z.guid(),
  staffId: z.guid(),
  notes: OptionalLocalizedContentSchema.optional(),
  isActive: z.boolean().default(true),
});

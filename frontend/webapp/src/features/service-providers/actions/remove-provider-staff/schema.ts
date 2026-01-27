import { z } from "zod/v4";

export const RemoveProviderStaffSchema = z.object({
  serviceProviderId: z.guid(),
  staffId: z.guid(),
});

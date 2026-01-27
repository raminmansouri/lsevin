import { z } from "zod/v4";

export const ChangeProviderTypeActivationSchema = z.object({
  providerTypeId: z.guid(),
  isActive: z.boolean(),
});

import { z } from "zod/v4";

export const ChangeServiceProviderActivationActionSchema = z.object({
  serviceProviderId: z.guid(),
  isActive: z.boolean(),
});

import { z } from "zod/v4";

export const removeProviderServiceSchema = z.object({
  serviceProviderId: z.guid(),
  serviceId: z.guid(),
});

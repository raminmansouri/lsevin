import { z } from "zod/v4";

export const removeProviderAttributeSchema = z.object({
  serviceProviderId: z.guid(),
  attributeId: z.guid(),
});

import { z } from "zod/v4";

export const AddServiceProviderRequestSchema = z.object({
  serviceProviderId: z.guid(),
  message: z.string().min(5),
});

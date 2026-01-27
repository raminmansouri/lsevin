import { z } from "zod/v4";

export const DeleteServiceProviderActionSchema = z.object({
  serviceProviderId: z.guid(),
});

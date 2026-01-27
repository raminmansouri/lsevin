import { z } from "zod/v4";

export const DeleteProviderTypeSchema = z.object({
  providerTypeId: z.guid(),
});

export type DeleteProviderTypeInput = z.infer<typeof DeleteProviderTypeSchema>;

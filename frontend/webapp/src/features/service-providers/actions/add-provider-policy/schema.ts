import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

export const addProviderPolicySchema = z.object({
  serviceProviderId: z.guid(),
  type: LocalizedContentSchema,
  description: LocalizedContentSchema,
});

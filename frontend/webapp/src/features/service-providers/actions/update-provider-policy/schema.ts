import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

export const UpdateProviderPolicySchema = z.object({
  serviceProviderId: z.guid(),
  policyId: z.guid(),
  type: LocalizedContentSchema,
  description: LocalizedContentSchema,
});

import { z } from "zod/v4";

export const removeProviderPolicySchema = z.object({
  serviceProviderId: z.guid(),
  policyId: z.guid(),
});

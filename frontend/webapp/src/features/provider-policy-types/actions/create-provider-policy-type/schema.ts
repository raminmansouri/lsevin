import { z } from "zod/v4";
import { CreateProviderPolicyTypeSchema } from "../../schemas";
export { CreateProviderPolicyTypeSchema };
export type CreateProviderPolicyTypeFormData = z.infer<typeof CreateProviderPolicyTypeSchema>;

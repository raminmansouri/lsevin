import { z } from "zod/v4";
import { DeleteProviderPolicyTypeSchema } from "../../schemas";
export { DeleteProviderPolicyTypeSchema };
export type DeleteProviderPolicyTypeFormData = z.infer<typeof DeleteProviderPolicyTypeSchema>;

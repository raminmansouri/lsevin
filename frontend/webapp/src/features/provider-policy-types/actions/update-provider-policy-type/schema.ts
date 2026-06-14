import { z } from "zod/v4";
import { UpdateProviderPolicyTypeSchema } from "../../schemas";
export { UpdateProviderPolicyTypeSchema };
export type UpdateProviderPolicyTypeFormData = z.infer<typeof UpdateProviderPolicyTypeSchema>;

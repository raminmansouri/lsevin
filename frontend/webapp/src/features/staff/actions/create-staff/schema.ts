import { z } from "zod/v4";
import { CreateStaffSchema } from "../../schemas";
export { CreateStaffSchema };
export type CreateStaffFormData = z.infer<typeof CreateStaffSchema>;

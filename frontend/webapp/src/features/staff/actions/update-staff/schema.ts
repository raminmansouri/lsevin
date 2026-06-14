import { z } from "zod/v4";
import { UpdateStaffSchema } from "../../schemas";
export { UpdateStaffSchema };
export type UpdateStaffFormData = z.infer<typeof UpdateStaffSchema>;

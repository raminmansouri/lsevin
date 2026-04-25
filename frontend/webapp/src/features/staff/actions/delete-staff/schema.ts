import { z } from "zod/v4";
import { DeleteStaffSchema } from "../../schemas";
export { DeleteStaffSchema };
export type DeleteStaffInput = z.infer<typeof DeleteStaffSchema>;

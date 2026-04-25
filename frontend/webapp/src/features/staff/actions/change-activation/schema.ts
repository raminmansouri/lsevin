import { z } from "zod/v4";
import { ChangeStaffActivationSchema } from "../../schemas";
export { ChangeStaffActivationSchema };
export type ChangeStaffActivationInput = z.infer<typeof ChangeStaffActivationSchema>;

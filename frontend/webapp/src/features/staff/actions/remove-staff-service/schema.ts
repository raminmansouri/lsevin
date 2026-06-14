import { z } from "zod/v4";

import { StaffServiceDeleteSchema } from "../../schemas";

export const RemoveStaffServiceSchema = StaffServiceDeleteSchema;

export type RemoveStaffServiceInput = z.infer<typeof RemoveStaffServiceSchema>;

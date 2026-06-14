import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { UpdateStaffServiceSchema } from "./schema";

export type InputType = z.infer<typeof UpdateStaffServiceSchema>;
export type ReturnType = ActionState<InputType, string>;

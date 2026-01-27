import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { CreateStaffSchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof CreateStaffSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

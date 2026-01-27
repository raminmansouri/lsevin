import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { UpdateStaffSchema } from "./schema";

export type OutputType = string;
export type RequestOutputType = boolean;
export type InputType = z.infer<typeof UpdateStaffSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

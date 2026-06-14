import { z } from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { UpdateProviderStaffSchema } from "./schema";

export type InputType = z.infer<typeof UpdateProviderStaffSchema>;
export type OutputType = boolean;
export type ReturnType = ActionState<InputType, OutputType>;

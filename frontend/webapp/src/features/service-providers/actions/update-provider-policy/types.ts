import { z } from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { UpdateProviderPolicySchema } from "./schema";

export type InputType = z.infer<typeof UpdateProviderPolicySchema>;
export type OutputType = string;
export type ReturnType = ActionState<InputType, OutputType>;

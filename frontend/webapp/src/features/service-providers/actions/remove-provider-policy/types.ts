import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { removeProviderPolicySchema } from "./schema";

export type InputType = z.infer<typeof removeProviderPolicySchema>;
export type OutputType = boolean;
export type ReturnType = ActionState<InputType, OutputType>;

import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { RemoveServiceRequirementSchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof RemoveServiceRequirementSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

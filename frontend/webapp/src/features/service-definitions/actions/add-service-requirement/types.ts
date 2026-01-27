import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { AddServiceRequirementSchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof AddServiceRequirementSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

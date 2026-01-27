import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { UpdateServiceRequirementSchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof UpdateServiceRequirementSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

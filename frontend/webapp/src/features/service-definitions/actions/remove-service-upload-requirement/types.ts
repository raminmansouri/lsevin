import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { RemoveServiceUploadRequirementSchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof RemoveServiceUploadRequirementSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

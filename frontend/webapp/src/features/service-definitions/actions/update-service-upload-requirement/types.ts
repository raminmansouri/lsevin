import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { UpdateServiceUploadRequirementSchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof UpdateServiceUploadRequirementSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

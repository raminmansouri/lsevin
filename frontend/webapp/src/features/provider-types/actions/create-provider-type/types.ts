import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { CreateProviderTypeSchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof CreateProviderTypeSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

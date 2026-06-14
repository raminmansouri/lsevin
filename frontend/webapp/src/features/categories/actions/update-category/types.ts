import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { UpdateCategorySchema } from "./schema";

export type OutputType = string;
export type RequestOutputType = boolean;
export type InputType = z.infer<typeof UpdateCategorySchema>;
export type ReturnType = ActionState<InputType, OutputType>;

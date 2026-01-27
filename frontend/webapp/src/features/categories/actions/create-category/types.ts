import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { CreateCategorySchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof CreateCategorySchema>;
export type ReturnType = ActionState<InputType, OutputType>;

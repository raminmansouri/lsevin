import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { DeleteCategorySchema } from "./schema";

export type OutputType = boolean;
export type InputType = z.infer<typeof DeleteCategorySchema>;
export type ReturnType = ActionState<InputType, OutputType>;

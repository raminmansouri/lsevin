import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { DeleteProviderTypeSchema } from "./schema";

export type OutputType = boolean;
export type InputType = z.infer<typeof DeleteProviderTypeSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

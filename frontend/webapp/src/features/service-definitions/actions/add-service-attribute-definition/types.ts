import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { AddServiceAttributeDefinitionSchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof AddServiceAttributeDefinitionSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

import { z } from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { UpdateProviderAttributeDefinitionSchema } from "./schema";

export type InputType = z.infer<typeof UpdateProviderAttributeDefinitionSchema>;
export type ReturnType = ActionState<InputType, string>;

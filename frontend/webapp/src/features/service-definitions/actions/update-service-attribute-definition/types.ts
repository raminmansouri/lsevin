import { z } from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { UpdateServiceAttributeDefinitionSchema } from "./schema";

export type InputType = z.infer<typeof UpdateServiceAttributeDefinitionSchema>;
export type ReturnType = ActionState<InputType, string>;

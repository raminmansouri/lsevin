import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { ChangeServiceDefinitionActivationSchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof ChangeServiceDefinitionActivationSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { ChangeServiceProviderActivationActionSchema } from "./schema";

export type OutputType = boolean;
export type InputType = z.infer<
  typeof ChangeServiceProviderActivationActionSchema
>;
export type ReturnType = ActionState<InputType, OutputType>;

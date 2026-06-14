import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { ChangeProviderTypeActivationSchema } from "./schema";

export type OutputType = boolean;
export type InputType = z.infer<typeof ChangeProviderTypeActivationSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

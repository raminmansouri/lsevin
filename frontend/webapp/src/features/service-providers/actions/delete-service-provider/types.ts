import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { DeleteServiceProviderActionSchema } from "./schema";

export type OutputType = boolean;
export type InputType = z.infer<typeof DeleteServiceProviderActionSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

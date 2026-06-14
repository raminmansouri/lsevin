import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { CreateServiceProviderActionSchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof CreateServiceProviderActionSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { UpdateServiceProviderActionSchema } from "./schema";

export type OutputType = string;
export type RequestOutputType = boolean;
export type InputType = z.infer<typeof UpdateServiceProviderActionSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

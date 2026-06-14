import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { AddServiceProviderRequestSchema } from "./schema";

export type InputType = z.infer<typeof AddServiceProviderRequestSchema>;
export type OutputType = string;
export type ReturnType = ActionState<InputType, OutputType>;

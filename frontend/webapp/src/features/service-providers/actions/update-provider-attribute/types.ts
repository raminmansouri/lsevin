import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { updateProviderAttributeSchema } from "./schema";

export type InputType = z.infer<typeof updateProviderAttributeSchema>;
export type OutputType = string;
export type ReturnType = ActionState<InputType, OutputType>;

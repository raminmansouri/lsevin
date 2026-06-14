import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { addProviderServiceSchema } from "./schema";

export type InputType = z.infer<typeof addProviderServiceSchema>;
export type OutputType = string;
export type ReturnType = ActionState<InputType, OutputType>;

import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { RemoveProviderStaffSchema } from "./schema";

export type InputType = z.infer<typeof RemoveProviderStaffSchema>;
export type OutputType = string;
export type ReturnType = ActionState<InputType, OutputType>;

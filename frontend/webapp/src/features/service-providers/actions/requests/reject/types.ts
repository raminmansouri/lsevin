import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { RejectSchema } from "./schema";

export type InputType = z.infer<typeof RejectSchema>;
export type OutputType = boolean;
export type ReturnType = ActionState<InputType, OutputType>;

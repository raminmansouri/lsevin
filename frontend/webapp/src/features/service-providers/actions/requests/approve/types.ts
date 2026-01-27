import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { ApproveSchema } from "./schema";

export type InputType = z.infer<typeof ApproveSchema>;
export type OutputType = boolean;
export type ReturnType = ActionState<InputType, OutputType>;

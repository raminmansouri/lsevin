import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { AddCommentSchema } from "./schema";

export type InputType = z.infer<typeof AddCommentSchema>;
export type OutputType = string; // Returns comment ID
export type ReturnType = ActionState<InputType, OutputType>;

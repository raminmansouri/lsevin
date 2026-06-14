import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { RemoveCommentSchema } from "./schema";

export type InputType = z.infer<typeof RemoveCommentSchema>;
export type OutputType = string;
export type ReturnType = ActionState<InputType, OutputType>;

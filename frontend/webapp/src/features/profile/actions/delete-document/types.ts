import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { DeleteDocumentSchema } from "./schema";

export type InputType = z.infer<typeof DeleteDocumentSchema>;
export type OutputType = string;
export type ReturnType = ActionState<InputType, OutputType>;

export const TRANSLATION_KEY = "User.Profile";

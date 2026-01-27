import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { UpdateAdditionalInfoSchema } from "./schema";

export type InputType = z.infer<typeof UpdateAdditionalInfoSchema>;
export type OutputType = string;
export type ReturnType = ActionState<InputType, OutputType>;

export const TRANSLATION_KEY = "User.Profile";

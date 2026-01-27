import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { VerifyEmailSchema } from "./schema";

export type OutputType = undefined;
export type InputType = z.infer<typeof VerifyEmailSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

export const TRANSLATION_KEY = "Auth.VerifyEmail";

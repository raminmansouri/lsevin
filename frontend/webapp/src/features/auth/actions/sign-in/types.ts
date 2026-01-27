import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { SignInSchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof SignInSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

export const TRANSLATION_KEY = "Auth.SignIn";

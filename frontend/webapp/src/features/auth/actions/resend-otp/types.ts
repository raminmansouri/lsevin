import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { ResendOtpSchema } from "./schema";

export interface OutputType {
  phoneNumber: string;
  expiresAt: string;
}

export type InputType = z.infer<typeof ResendOtpSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

export const TRANSLATION_KEY = "Auth.Otp";

import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { VerifyOtpSchema } from "./schema";

export interface OutputType {
  accessToken?: string;
  refreshToken?: string;
  /** Locale-prefixed page to land on instead of the requested one (set by role). */
  destination?: string;
}

export type InputType = z.infer<typeof VerifyOtpSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

export const TRANSLATION_KEY = "Auth.Otp";

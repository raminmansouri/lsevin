import { CountryCode } from "libphonenumber-js";
import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { SignUpSchema } from "./schema";

export type OutputType = string;
export type InputType = z.infer<typeof SignUpSchema>;
export type ApiInputType = Omit<InputType, "phoneNumber"> & {
  phoneNumber: string;
  phoneNumberCountryCode: CountryCode;
};
export type ReturnType = ActionState<InputType, OutputType>;

export const TRANSLATION_KEY = "Auth.SignUp";

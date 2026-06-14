import * as z from "zod/v4";

import { ActionState } from "@/lib/safe-action";

import { UpdateBaseInfoSchema } from "./schema";

export type InputType = z.infer<typeof UpdateBaseInfoSchema>;
export type OutputType = string;
export type ReturnType = ActionState<InputType, OutputType>;

export type ApiInputType = InputType & {
  userName: string;
  phoneNumber: string;
  phoneNumberCountryCode: string;
};

export const TRANSLATION_KEY = "User.Profile";

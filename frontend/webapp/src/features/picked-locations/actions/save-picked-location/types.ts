import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { PickedLocationMutationSchema } from "../../schemas";

export type OutputType = string;
export type InputType = z.infer<typeof PickedLocationMutationSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

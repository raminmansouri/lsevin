import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { DeletePickedLocationSchema } from "../../schemas";

export type OutputType = boolean;
export type InputType = z.infer<typeof DeletePickedLocationSchema>;
export type ReturnType = ActionState<InputType, OutputType>;

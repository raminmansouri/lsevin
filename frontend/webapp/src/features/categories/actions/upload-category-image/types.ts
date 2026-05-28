import { z } from "zod/v4";

import type { ActionState } from "@/lib/safe-action";

import { UpdateCategorySchema } from "./schema";

export type OutputType = string;
export type RequestOutputType = boolean;
export type InputType = z.infer<typeof UpdateCategorySchema>;
export type ReturnType = ActionState<InputType, OutputType>;



type ActionError = {
  detail?: string;
  title?: string;
  status?: number;
};

export type UpdateCategoryImageActionState = {
  ok: boolean;
  message?: string;
  error?: ActionError;
  categoryId?: string;
  timestamp: number;
};

export const initialUpdateCategoryImageActionState: UpdateCategoryImageActionState =
  {
    ok: false,
    timestamp: 0,
  };

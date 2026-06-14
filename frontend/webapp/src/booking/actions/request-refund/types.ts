import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import { RequestRefundSchema } from "./schema";

export type InputType = z.infer<typeof RequestRefundSchema>;
export type OutputType = {
  refundRequestId: string;
  status: string;
  alreadyExists: boolean;
};
export type ReturnType = ActionState<InputType, OutputType>;

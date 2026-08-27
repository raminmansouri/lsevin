import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import { ApproveBookingPaymentSchema } from "./schema";

export type InputType = z.infer<typeof ApproveBookingPaymentSchema>;
export type OutputType = { ok: true; status: string };
export type ReturnType = ActionState<InputType, OutputType>;

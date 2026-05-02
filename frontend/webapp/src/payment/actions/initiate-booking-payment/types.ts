import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import type { InitiateBookingPaymentOutput } from "@/payment/types";
import { InitiateBookingPaymentSchema } from "./schema";

export type InputType = z.infer<typeof InitiateBookingPaymentSchema>;
export type OutputType = InitiateBookingPaymentOutput;
export type ReturnType = ActionState<InputType, OutputType>;

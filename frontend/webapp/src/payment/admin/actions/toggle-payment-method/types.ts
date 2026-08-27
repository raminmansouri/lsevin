import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import type { PaymentMethodConfig } from "@/payment/server/payment-method.repository";
import { TogglePaymentMethodSchema } from "./schema";

export type InputType = z.infer<typeof TogglePaymentMethodSchema>;
export type OutputType = PaymentMethodConfig;
export type ReturnType = ActionState<InputType, OutputType>;

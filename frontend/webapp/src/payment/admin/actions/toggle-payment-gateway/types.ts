import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import type { PaymentGatewayConfig } from "@/payment/server/payment-gateway.repository";
import { TogglePaymentGatewaySchema } from "./schema";

export type InputType = z.infer<typeof TogglePaymentGatewaySchema>;
export type OutputType = PaymentGatewayConfig;
export type ReturnType = ActionState<InputType, OutputType>;

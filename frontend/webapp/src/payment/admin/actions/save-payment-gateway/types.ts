import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import type { PaymentGatewayConfig } from "@/payment/server/payment-gateway.repository";
import { SavePaymentGatewaySchema } from "./schema";

export type InputType = z.infer<typeof SavePaymentGatewaySchema>;
export type OutputType = PaymentGatewayConfig;
export type ReturnType = ActionState<InputType, OutputType>;

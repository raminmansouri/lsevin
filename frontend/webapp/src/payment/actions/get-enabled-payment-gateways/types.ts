import * as z from "zod/v4";

import type { ActionState } from "@/lib/safe-action";
import type { PaymentGatewayCode } from "@/payment/types";
import { GetEnabledPaymentGatewaysSchema } from "./schema";

export type AvailablePaymentGateway = {
  code: PaymentGatewayCode;
  displayName: string;
  provider: string;
  currency?: string | null;
  sortOrder?: number;
};

export type InputType = z.infer<typeof GetEnabledPaymentGatewaysSchema>;
export type OutputType = AvailablePaymentGateway[];
export type ReturnType = ActionState<InputType, OutputType>;

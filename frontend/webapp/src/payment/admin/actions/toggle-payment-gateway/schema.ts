import * as z from "zod/v4";
import { PAYMENT_GATEWAY_CODES } from "@/payment/gateways";

export const TogglePaymentGatewaySchema = z.object({
  code: z.enum(PAYMENT_GATEWAY_CODES),
  isEnabled: z.boolean(),
});

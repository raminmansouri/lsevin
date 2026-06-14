import * as z from "zod/v4";

export const TogglePaymentGatewaySchema = z.object({
  code: z.enum(["zarinpal"]),
  isEnabled: z.boolean(),
});

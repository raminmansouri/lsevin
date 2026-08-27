import * as z from "zod/v4";

export const TogglePaymentMethodSchema = z.object({
  code: z.enum(["pay_on_delivery", "bank_receipt"]),
  isActive: z.boolean(),
});

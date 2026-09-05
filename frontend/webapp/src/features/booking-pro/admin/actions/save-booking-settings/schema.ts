import * as z from "zod/v4";

export const SaveBookingSettingsSchema = z.object({
  shopProductsStepEnabled: z.boolean().default(false),
});

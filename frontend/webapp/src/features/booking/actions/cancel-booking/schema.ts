import { z } from "zod/v4";

import { OptionalLocalizedContentSchema } from "@/features/shared/schemas/localization";

export const CancelBookingSchema = z.object({
  bookingId: z.guid(),
  reason: z.string().optional(),
});

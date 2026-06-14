import { z } from "zod/v4";

export const RequestRefundSchema = z.object({
  bookingId: z.string().trim().min(1, "Booking id is required"),
  reason: z.string().trim().min(3, "Refund reason is required").max(1000),
  customerNote: z.string().trim().max(2000).optional(),
  refundScope: z.enum(["full", "partial"]).optional(),
});

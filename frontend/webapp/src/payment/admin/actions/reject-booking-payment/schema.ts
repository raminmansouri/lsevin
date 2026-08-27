import * as z from "zod/v4";

export const RejectBookingPaymentSchema = z.object({
  paymentId: z.string().trim().min(1),
  bookingId: z.string().trim().min(1),
  reason: z.string().trim().max(300).optional(),
});

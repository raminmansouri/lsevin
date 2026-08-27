import * as z from "zod/v4";

export const ApproveBookingPaymentSchema = z.object({
  paymentId: z.string().trim().min(1),
  bookingId: z.string().trim().min(1),
});

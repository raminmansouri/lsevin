import z from "zod/v3";

/**
 * 1️⃣  The overall schema – we’ll *extend* it per step
 */
export const bookingSchema = z.object({
  providerId: z.string().min(1, "providerId is required"),
  serviceId: z.string().min(1, "serviceId is required"),
  specialistId: z.string().min(1, "specialistId is required"),
});


export type BookingFormValues = z.infer<typeof bookingSchema>;

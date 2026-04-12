import z from "zod/v3";

/* ──────────────────────────────────────────────────────
   1️⃣  Booking – the “raw” schema that will be extended
   by the different steps of the wizard.
   ────────────────────────────────────────────────────── */

export const bookingSchema = z.object({
  /* -------------- core identifiers -------------- */
  providerId:   z.string().min(1, { message: "providerId is required" }),
  serviceId:    z.string().min(1, { message: "serviceId is required" }),
  specialistId: z.string().min(1, { message: "specialistId is required" }),

  /* -------------- date / time selection -------------- */
  selectedDate:     z.string().min(1, { message: "selectedDate is required" }),
  selectedDateFrom: z.string().min(1, { message: "selectedDateFrom is required" }),
  selectedDateTo:   z.string().min(1, { message: "selectedDateTo is required" }),

  selectedTime:     z.string().min(1, { message: "selectedTime is required" }),
  selectedTimeFrom: z.string().min(1, { message: "selectedTimeFrom is required" }),
  selectedTimeTo:   z.string().min(1, { message: "selectedTimeTo is required" }),

  /* -------------- add‑ons -------------- */
  addOns: z
    .array(
      z.object({
        id:          z.string(),
        name:        z.string(),
        description: z.string().optional(),
        price:       z.number(),
        icon:        z.any(),                // e.g. a React component
        popular:     z.boolean().optional(),
        details:     z.array(z.string()).optional(),
      })
    )
    .min(1, { message: "At least one add‑on must be selected" }),

  /* -------------- uploaded documents -------------- */
  uploadFiles: z
    .array(
      z.object({
        file:        z.instanceof(File),
        description: z.string().optional(),
        docId:       z.string(),
      })
    )
    .min(1, { message: "At least one document must be uploaded" }),

  /* -------------- additional services (optional) -------------- */
  additionalServices: z
    .array(
      z.object({
        id:          z.string(),
        name:        z.string(),
        description: z.string().optional(),
        duration:    z.string().optional(),
        price:       z.number().optional(),
        category:    z.string().optional(),
        image:       z.string().optional(),
      })
    )
    .optional(),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;

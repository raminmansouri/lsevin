import { z } from "zod/v4";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "invalidDate" });

export const UpsertTourDepartureSchema = z
  .object({
    id: z.uuid().optional(),
    providerServiceId: z.uuid(),
    startsOn: dateString,
    endsOn: dateString,
    capacity: z.coerce.number().int().min(1),
    isActive: z.boolean().default(true),
  })
  .refine((values) => values.endsOn >= values.startsOn, {
    message: "endsBeforeStarts",
    path: ["endsOn"],
  });
export type UpsertTourDepartureInput = z.input<typeof UpsertTourDepartureSchema>;

export const DeleteTourDepartureSchema = z.object({ id: z.uuid() });

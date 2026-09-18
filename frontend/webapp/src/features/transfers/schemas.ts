import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

export const UpsertTransferRouteSchema = z.object({
  id: z.uuid().optional(),
  providerServiceId: z.uuid(),
  serviceProviderId: z.uuid(),
  fromTranslations: LocalizedContentSchema,
  toTranslations: LocalizedContentSchema,
  vehicleType: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value ? value : undefined)),
});
export type UpsertTransferRouteInput = z.input<typeof UpsertTransferRouteSchema>;

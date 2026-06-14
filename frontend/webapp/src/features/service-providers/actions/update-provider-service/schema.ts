import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

export const UpdateProviderServiceSchema = z.object({
  serviceProviderId: z.guid(),
  serviceId: z.guid(),
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  price: z.number().min(0),
  currency: z.string().min(3).max(3),
  durationMinutes: z.number().min(0),
  trendingScore: z.number().min(0).optional(),
  isActive: z.boolean(),
});

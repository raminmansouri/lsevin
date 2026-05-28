import { z } from "zod/v4";

import {
  LocalizedContentSchema,
  OptionalLocalizedContentSchema,
} from "@/features/shared/schemas/localization";

export const addProviderServiceSchema = z.object({
  serviceProviderId: z.guid(),
  serviceDefinitionId: z.guid(),
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  price: z.number().min(0).optional(),
  currency: z.string().min(3).max(3).optional(),
  durationMinutes: z.number().min(0).optional(),
  trendingScore: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  notes: OptionalLocalizedContentSchema.optional(),
});

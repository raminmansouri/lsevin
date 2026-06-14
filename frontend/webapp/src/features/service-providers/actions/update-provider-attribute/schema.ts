import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

export const updateProviderAttributeSchema = z.object({
  serviceProviderId: z.guid(),
  attributeDefinitionId: z.guid(),
  value: LocalizedContentSchema,
});

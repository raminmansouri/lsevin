import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

export const addGalleryItemSchema = z.object({
  serviceProviderId: z.guid(),
  title: LocalizedContentSchema,
  description: LocalizedContentSchema,
  file: z.instanceof(File).optional(),
});

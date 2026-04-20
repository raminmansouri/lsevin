import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

export const updateProviderGalleryItemSchema = z.object({
  serviceProviderId: z.guid(),
  galleryItemId: z.guid(),
  title: LocalizedContentSchema,
  description: LocalizedContentSchema,
  displayOrder: z.number().int().min(0),
  file: z.instanceof(File).optional(),
});

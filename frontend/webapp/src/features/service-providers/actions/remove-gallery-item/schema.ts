import { z } from "zod/v4";

export const removeGalleryItemSchema = z.object({
  serviceProviderId: z.guid(),
  galleryItemId: z.guid(),
});

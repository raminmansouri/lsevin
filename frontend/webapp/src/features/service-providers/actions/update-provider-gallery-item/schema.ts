import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

import { normalizeAdminLocalizedContent } from "../../lib/admin-form-normalizers";

const FlexibleLocalizedContentSchema = z.preprocess((value) => {
  if (value && typeof value === "object" && "translations" in (value as Record<string, unknown>)) {
    return {
      ...(value as Record<string, unknown>),
      translations: normalizeAdminLocalizedContent((value as Record<string, unknown>).translations),
    };
  }

  return { translations: normalizeAdminLocalizedContent(value) };
}, LocalizedContentSchema);

export const updateProviderGalleryItemSchema = z.object({
  serviceProviderId: z.guid(),
  galleryItemId: z.guid(),
  title: FlexibleLocalizedContentSchema,
  description: FlexibleLocalizedContentSchema,
  displayOrder: z.number().int().min(0),
  file: z.instanceof(File).optional(),
});

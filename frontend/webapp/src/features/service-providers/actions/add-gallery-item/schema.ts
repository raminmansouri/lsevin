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

export const addGalleryItemSchema = z.object({
  serviceProviderId: z.guid(),
  title: FlexibleLocalizedContentSchema,
  description: FlexibleLocalizedContentSchema,
  file: z.instanceof(File).optional(),
});

import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

// Category schema for create/update operations (matches API_CHANGES.md)
export const CategorySchema = z.object({
  categoryId: z.guid().optional(),
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  parentId: z.guid().optional(),
});

export const CategoryFormSchema = CategorySchema;

// Type exports
export type CategoryInput = z.infer<typeof CategorySchema>;
export type CategoryFormInput = z.infer<typeof CategoryFormSchema>;

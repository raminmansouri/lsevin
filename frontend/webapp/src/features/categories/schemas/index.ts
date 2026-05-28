import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

// Category schema for create/update operations (matches API_CHANGES.md)
export const CategorySchema = z.object({
  categoryId: z.string().optional(),
  name: z.any(),
  description: z.any().optional(),
  parentId: z.string().optional(),
  gradient: z.string().optional(),
  overlayColor: z.string().optional(),
  overlayOpacity: z.coerce.number().min(0).max(1).optional(),
  image: z.instanceof(File).optional(),
  // removeImage: z.boolean().optional(),
});

export const CategoryFormSchema = CategorySchema;

// Type exports
export type CategoryInput = z.infer<typeof CategorySchema>;
export type CategoryFormInput = z.infer<typeof CategoryFormSchema>;

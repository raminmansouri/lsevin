import { z } from "zod/v4";

export const DeleteCategorySchema = z.object({
  categoryId: z.guid(),
});

export type DeleteCategoryInput = z.infer<typeof DeleteCategorySchema>;

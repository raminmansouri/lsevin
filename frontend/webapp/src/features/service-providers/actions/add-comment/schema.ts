import { z } from "zod/v4";

export const AddCommentSchema = z.object({
  serviceProviderId: z.guid(),
  commentText: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
});

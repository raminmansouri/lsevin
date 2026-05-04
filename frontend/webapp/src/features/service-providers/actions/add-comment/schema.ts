import { z } from "zod/v4";

export const AddCommentSchema = z.object({
  serviceProviderId: z.guid(),
  commentText: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
  pros: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
  cons: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
});

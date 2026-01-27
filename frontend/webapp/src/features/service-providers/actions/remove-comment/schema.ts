import { z } from "zod/v4";

export const RemoveCommentSchema = z.object({
  serviceProviderId: z.guid(),
  commentId: z.guid(),
});

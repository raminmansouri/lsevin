import { z } from "zod/v4";

export const RejectSchema = z.object({
  requestId: z.guid(),
});

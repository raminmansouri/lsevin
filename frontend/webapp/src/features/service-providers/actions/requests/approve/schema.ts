import { z } from "zod/v4";

export const ApproveSchema = z.object({
  requestId: z.guid(),
});

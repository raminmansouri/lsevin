import { z } from "zod/v4";

export const DeleteDocumentSchema = z.object({
  documentId: z.string().min(1),
});

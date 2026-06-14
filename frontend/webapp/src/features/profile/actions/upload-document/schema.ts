import { z } from "zod/v4";

import { fileUploadSchema } from "@/features/shared/types/schemas";
import { DocumentType } from "@/features/shared/types/user";

export const UploadDocumentSchema = z.object({
  documentType: z.enum(DocumentType),
  documentFile: fileUploadSchema,
});

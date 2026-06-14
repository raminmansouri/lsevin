import { z } from "zod/v4";

export const CreateConsultingRequestSchema = z.object({
  description: z.string().min(10),
  categoryId: z.string().min(1),
  categoryName: z.string().min(1),
  documentIds: z.array(z.string()).min(1),
});

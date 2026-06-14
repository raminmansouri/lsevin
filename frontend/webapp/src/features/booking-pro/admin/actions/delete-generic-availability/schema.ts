import * as z from "zod/v4";

export const DeleteGenericAvailabilityRuleSchema = z.object({
  id: z.string().trim().min(1),
});

export const DeleteBookableResourceSchema = z.object({
  id: z.string().trim().min(1),
});

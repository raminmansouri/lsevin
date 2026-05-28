import * as z from "zod/v4";

export const ToggleGenericAvailabilityRuleSchema = z.object({
  id: z.string().trim().min(1),
  isActive: z.coerce.boolean(),
});

export const ToggleBookableResourceSchema = z.object({
  id: z.string().trim().min(1),
  isActive: z.coerce.boolean(),
});

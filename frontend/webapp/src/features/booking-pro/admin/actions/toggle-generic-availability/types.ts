import type { z } from "zod/v4";
import type { ToggleBookableResourceSchema, ToggleGenericAvailabilityRuleSchema } from "./schema";

export type ToggleGenericAvailabilityRuleInput = z.infer<typeof ToggleGenericAvailabilityRuleSchema>;
export type ToggleBookableResourceInput = z.infer<typeof ToggleBookableResourceSchema>;

export type ToggleGenericAvailabilityRuleReturn = {
  data?: { id: string; isActive: boolean };
  error?: { title: string; status: number; detail?: string };
  payload?: ToggleGenericAvailabilityRuleInput;
};

export type ToggleBookableResourceReturn = {
  data?: { id: string; isActive: boolean };
  error?: { title: string; status: number; detail?: string };
  payload?: ToggleBookableResourceInput;
};

import type { z } from "zod/v4";
import type { SaveBookableResourceSchema, SaveGenericAvailabilityRuleSchema } from "./schema";

export type SaveGenericAvailabilityRuleInput = z.infer<typeof SaveGenericAvailabilityRuleSchema>;
export type SaveBookableResourceInput = z.infer<typeof SaveBookableResourceSchema>;

export type SaveGenericAvailabilityRuleReturn = {
  data?: { id: string; ids?: string[] };
  error?: { title: string; status: number; detail?: string };
  payload?: SaveGenericAvailabilityRuleInput;
};

export type SaveBookableResourceReturn = {
  data?: { id: string };
  error?: { title: string; status: number; detail?: string };
  payload?: SaveBookableResourceInput;
};

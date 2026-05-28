import type { z } from "zod/v4";
import type { DeleteBookableResourceSchema, DeleteGenericAvailabilityRuleSchema } from "./schema";

export type DeleteGenericAvailabilityRuleInput = z.infer<typeof DeleteGenericAvailabilityRuleSchema>;
export type DeleteBookableResourceInput = z.infer<typeof DeleteBookableResourceSchema>;

export type DeleteGenericAvailabilityRuleReturn = {
  data?: { id: string };
  error?: { title: string; status: number; detail?: string };
  payload?: DeleteGenericAvailabilityRuleInput;
};

export type DeleteBookableResourceReturn = {
  data?: { id: string };
  error?: { title: string; status: number; detail?: string };
  payload?: DeleteBookableResourceInput;
};

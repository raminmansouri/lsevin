import { z } from "zod/v4";

export const AddFollowupScheduleRuleSchema = z.object({
  caseType: z.string().trim().min(1).max(100),
  daysAfterCompletion: z.number().int().min(0).max(3650),
  title: z.string().trim().min(1).max(300),
  requiredItems: z.string().trim().max(500).optional(),
});
export type AddFollowupScheduleRuleInput = z.input<typeof AddFollowupScheduleRuleSchema>;

export const DeactivateFollowupScheduleRuleSchema = z.object({
  id: z.uuid(),
});
export type DeactivateFollowupScheduleRuleInput = z.input<typeof DeactivateFollowupScheduleRuleSchema>;

export const UpdateFollowUpStatusSchema = z.object({
  id: z.uuid(),
  followupStatus: z.enum(["scheduled", "completed", "missed", "cancelled"]),
});
export type UpdateFollowUpStatusInput = z.input<typeof UpdateFollowUpStatusSchema>;

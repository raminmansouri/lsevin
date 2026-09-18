import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

import { MEMBERSHIP_MONTH_STATUSES } from "./types";

export const UpsertMembershipPlanSchema = z.object({
  id: z.uuid().optional(),
  serviceProviderId: z.uuid(),
  nameTranslations: LocalizedContentSchema,
  monthlyPrice: z.coerce.number().min(0),
  currency: z.string().trim().min(1).max(15).default("IRR"),
  isActive: z.boolean().default(true),
});
export type UpsertMembershipPlanInput = z.input<typeof UpsertMembershipPlanSchema>;

export const DeleteMembershipPlanSchema = z.object({ id: z.uuid() });

/** YYYY-MM only -- the day-of-month is meaningless here and the repository always
 * normalizes to the first of the month, matching db/migrations/0039's own check
 * constraint (period_month = date_trunc('month', period_month)). */
const yearMonth = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, { message: "invalidMonth" });

export const SubmitMembershipMonthsSchema = z.object({
  membershipPlanId: z.uuid(),
  /** One or more calendar months to pay for at once -- up to 12, matching
   * "being able to pay 12 months". */
  periodMonths: z.array(yearMonth).min(1).max(12),
  paymentReference: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value ? value : undefined)),
});
export type SubmitMembershipMonthsInput = z.input<typeof SubmitMembershipMonthsSchema>;

export const ReviewMembershipMonthSchema = z
  .object({
    id: z.uuid(),
    decision: z.enum(["approved", "rejected"]),
    note: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((value) => (value ? value : undefined)),
  })
  .refine((values) => values.decision !== "rejected" || Boolean(values.note), {
    message: "reasonRequiredToReject",
    path: ["note"],
  });
export type ReviewMembershipMonthInput = z.input<typeof ReviewMembershipMonthSchema>;

export const GymMembershipMonthListFiltersSchema = z.object({
  status: z.enum([...MEMBERSHIP_MONTH_STATUSES, "all"]).default("all"),
  search: z.string().trim().max(160).default(""),
  pageNumber: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

import { z } from "zod/v4";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "invalidDate" });

export const UpsertTourDepartureSchema = z
  .object({
    id: z.uuid().optional(),
    providerServiceId: z.uuid(),
    startsOn: dateString,
    endsOn: dateString,
    capacity: z.coerce.number().int().min(1),
    isActive: z.boolean().default(true),
  })
  .refine((values) => values.endsOn >= values.startsOn, {
    message: "endsBeforeStarts",
    path: ["endsOn"],
  });
export type UpsertTourDepartureInput = z.input<typeof UpsertTourDepartureSchema>;

export const DeleteTourDepartureSchema = z.object({ id: z.uuid() });

export const CreateGatheringCampaignSchema = z.object({
  providerServiceId: z.uuid(),
  targetHeadcount: z.coerce.number().int().min(2),
  pricePerPerson: z.coerce.number().min(0),
  currency: z.string().trim().min(1).max(15).default("IRR"),
  joinDeadline: dateString.optional().or(z.literal("")).transform((value) => (value ? value : undefined)),
});
export type CreateGatheringCampaignInput = z.input<typeof CreateGatheringCampaignSchema>;

export const ConfirmGatheringCampaignSchema = z
  .object({
    id: z.uuid(),
    confirmedStartsOn: dateString,
    confirmedEndsOn: dateString,
  })
  .refine((values) => values.confirmedEndsOn >= values.confirmedStartsOn, {
    message: "endsBeforeStarts",
    path: ["confirmedEndsOn"],
  });
export type ConfirmGatheringCampaignInput = z.input<typeof ConfirmGatheringCampaignSchema>;

export const CancelGatheringCampaignSchema = z.object({ id: z.uuid() });

export const JoinGatheringCampaignSchema = z.object({
  campaignId: z.uuid(),
  paymentReference: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value ? value : undefined)),
});
export type JoinGatheringCampaignInput = z.input<typeof JoinGatheringCampaignSchema>;

/** Mandatory note to reject, optional to approve -- same convention
 * gym-memberships' ReviewMembershipMonthSchema and shop's reviewReturnRequest
 * both already use. */
export const ReviewGatheringParticipantSchema = z
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
export type ReviewGatheringParticipantInput = z.input<typeof ReviewGatheringParticipantSchema>;

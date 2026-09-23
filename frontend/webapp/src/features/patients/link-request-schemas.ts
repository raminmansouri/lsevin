import { z } from "zod/v4";

import { PATIENT_IDENTIFIER_TYPES, PATIENT_RELATIONSHIP_TYPES } from "./schemas";

const FAMILY_RELATIONSHIP_TYPES = PATIENT_RELATIONSHIP_TYPES.filter((type) => type !== "self");

export const SubmitAccountLinkRequestSchema = z.object({
  relationshipType: z.enum(FAMILY_RELATIONSHIP_TYPES as [string, ...string[]]),
  identifierType: z.enum(PATIENT_IDENTIFIER_TYPES),
  identifierValue: z.string().trim().min(1).max(100),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  birthDate: z.string().trim().min(1).optional(),
});
export type SubmitAccountLinkRequestInput = z.input<typeof SubmitAccountLinkRequestSchema>;

export const ReviewAccountLinkRequestSchema = z.object({
  id: z.uuid(),
  decision: z.enum(["approved", "rejected"]),
  patientId: z.uuid().optional(),
  accessRole: z.enum(["full", "limited", "view_only"]).optional(),
  reviewNotes: z.string().trim().max(500).optional(),
});
export type ReviewAccountLinkRequestInput = z.input<typeof ReviewAccountLinkRequestSchema>;

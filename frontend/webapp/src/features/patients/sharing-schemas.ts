import { z } from "zod/v4";

export const CONSENT_TYPES = ["data_sharing", "marketing", "treatment", "research", "family_access", "other"] as const;
export const CONSENT_RECIPIENT_TYPES = ["family_member", "coordinator", "provider", "organization", "external_party", "other"] as const;

/** Spec V5.2's explicit data-scope vocabulary. Deny-by-default: an empty
 * scope selection grants nothing. */
export const DATA_SCOPES = [
  "demographics",
  "identifiers",
  "conditions",
  "allergies",
  "medications",
  "procedures",
  "labs",
  "imaging",
  "documents",
  "reproductive_history",
  "cosmetic_history",
  "case_data",
  "travel_information",
  "billing_information",
] as const;

export const GrantConsentSchema = z.object({
  patientId: z.uuid(),
  consentType: z.enum(CONSENT_TYPES),
  purpose: z.string().trim().min(1).max(500),
  recipientType: z.enum(CONSENT_RECIPIENT_TYPES),
  recipientId: z.uuid().optional(),
  scope: z.array(z.enum(DATA_SCOPES)).min(1),
  validUntil: z.string().min(1).optional(),
});
export type GrantConsentInput = z.input<typeof GrantConsentSchema>;

export const WithdrawConsentSchema = z.object({
  id: z.uuid(),
});
export type WithdrawConsentInput = z.input<typeof WithdrawConsentSchema>;

export const CreateShareGrantSchema = z.object({
  patientId: z.uuid(),
  medicalCaseId: z.uuid().optional(),
  recipientName: z.string().trim().max(200).optional(),
  recipientContact: z.string().trim().max(200).optional(),
  scope: z.array(z.string().min(1)).min(1),
  expiresInHours: z.number().int().min(1).max(24 * 30),
  pin: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/)
    .optional(),
  maxAccessCount: z.number().int().min(1).optional(),
});
export type CreateShareGrantInput = z.input<typeof CreateShareGrantSchema>;

export const RevokeShareGrantSchema = z.object({
  id: z.uuid(),
});
export type RevokeShareGrantInput = z.input<typeof RevokeShareGrantSchema>;

export const RevokeAccountLinkSchema = z.object({
  accountId: z.uuid(),
  patientId: z.uuid(),
});
export type RevokeAccountLinkInput = z.input<typeof RevokeAccountLinkSchema>;

import { z } from "zod/v4";

export const PATIENT_IDENTIFIER_TYPES = [
  "ir_national_id",
  "national_id",
  "passport",
  "foreigner_id",
  "residence_permit",
  "insurance_id",
  "hospital_mrn",
  "lsevin_patient_number",
  "temporary_id",
  "other",
] as const;

export const PATIENT_RELATIONSHIP_TYPES = [
  "self",
  "parent",
  "child",
  "guardian",
  "caregiver",
  "authorized_person",
  "other",
] as const;

export const PATIENT_CONTACT_TYPES = ["mobile", "phone", "whatsapp", "email", "emergency"] as const;

export const PATIENT_CREATION_SOURCES = [
  "patient_signup",
  "admin",
  "coordinator",
  "provider",
  "import",
  "api",
] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "invalid" });

export const CreatePatientSchema = z.object({
  firstName: z.string().trim().min(1).max(200),
  middleName: z.string().trim().max(200).optional(),
  lastName: z.string().trim().min(1).max(200),
  preferredName: z.string().trim().max(200).optional(),
  birthDate: isoDate.optional(),
  birthDatePrecision: z.enum(["day", "month", "year", "unknown"]).optional(),
  sexAtBirth: z.enum(["male", "female", "other", "unknown"]).optional(),
  gender: z.string().trim().max(50).optional(),
  nationalityCountryCode: z.string().trim().length(2).optional(),
  primaryLanguage: z.string().trim().max(10).optional(),
  createdBySource: z.enum(PATIENT_CREATION_SOURCES),
});
export type CreatePatientInput = z.input<typeof CreatePatientSchema>;

export const UpdatePatientSchema = z.object({
  patientId: z.uuid(),
  version: z.number().int().positive(),
  firstName: z.string().trim().min(1).max(200).optional(),
  middleName: z.string().trim().max(200).optional(),
  lastName: z.string().trim().min(1).max(200).optional(),
  preferredName: z.string().trim().max(200).optional(),
  birthDate: isoDate.optional(),
  birthDatePrecision: z.enum(["day", "month", "year", "unknown"]).optional(),
  sexAtBirth: z.enum(["male", "female", "other", "unknown"]).optional(),
  gender: z.string().trim().max(50).optional(),
  nationalityCountryCode: z.string().trim().length(2).optional(),
  primaryLanguage: z.string().trim().max(10).optional(),
  status: z.enum(["active", "inactive", "deceased", "merged", "archived"]).optional(),
});
export type UpdatePatientInput = z.input<typeof UpdatePatientSchema>;

export const AddPatientIdentifierSchema = z.object({
  patientId: z.uuid(),
  identifierType: z.enum(PATIENT_IDENTIFIER_TYPES),
  value: z.string().trim().min(1).max(100),
  issuingCountryCode: z.string().trim().length(2).optional(),
  issuingAuthority: z.string().trim().max(200).optional(),
  system: z.string().trim().max(200).optional(),
  isPrimary: z.boolean().optional(),
  validFrom: isoDate.optional(),
  validUntil: isoDate.optional(),
});
export type AddPatientIdentifierInput = z.input<typeof AddPatientIdentifierSchema>;

export const FindPatientByIdentifierSchema = z.object({
  identifierType: z.enum(PATIENT_IDENTIFIER_TYPES),
  value: z.string().trim().min(1).max(100),
  issuingCountryCode: z.string().trim().length(2).optional(),
  issuingAuthority: z.string().trim().max(200).optional(),
});
export type FindPatientByIdentifierInput = z.input<typeof FindPatientByIdentifierSchema>;

export const LinkAccountToPatientSchema = z.object({
  patientId: z.uuid(),
  accountId: z.uuid(),
  relationshipType: z.enum(PATIENT_RELATIONSHIP_TYPES),
  accessRole: z.enum(["full", "limited", "view_only"]).optional(),
  isPrimaryProfile: z.boolean().optional(),
});
export type LinkAccountToPatientInput = z.input<typeof LinkAccountToPatientSchema>;

export const AddPatientContactSchema = z.object({
  patientId: z.uuid(),
  contactType: z.enum(PATIENT_CONTACT_TYPES),
  value: z.string().trim().min(1).max(200),
  countryCode: z.string().trim().max(5).optional(),
  isPrimary: z.boolean().optional(),
});
export type AddPatientContactInput = z.input<typeof AddPatientContactSchema>;

export const AddPatientAddressSchema = z.object({
  patientId: z.uuid(),
  countryCode: z.string().trim().length(2).optional(),
  city: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(20).optional(),
  addressLine1: z.string().trim().max(300).optional(),
  addressLine2: z.string().trim().max(300).optional(),
  isPrimary: z.boolean().optional(),
});
export type AddPatientAddressInput = z.input<typeof AddPatientAddressSchema>;

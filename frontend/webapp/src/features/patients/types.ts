/**
 * Patient 360 V0 (Foundation / Identity Core). See
 * docs/LSevin_Patient_360_Spiral_Requirements.md and
 * db/migrations/0048_patient_foundation.sql for the full spec/schema this
 * feature implements.
 */

export const PATIENTS_TRANSLATION_KEY = "Patients";

export type PatientActionResult<T = undefined> = {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type PatientStatus = "active" | "inactive" | "deceased" | "merged" | "archived";

export type PatientRow = {
  id: string;
  publicId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  preferredName: string | null;
  birthDate: string | null;
  birthDatePrecision: string;
  sexAtBirth: string | null;
  gender: string | null;
  nationalityCountryCode: string | null;
  primaryLanguage: string | null;
  status: PatientStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type PatientIdentifierRow = {
  id: string;
  patientId: string;
  identifierType: string;
  maskedValue: string;
  issuingCountryCode: string | null;
  issuingAuthority: string | null;
  system: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  validFrom: string | null;
  validUntil: string | null;
  status: string;
  createdAt: string;
};

export type AccountPatientLinkRow = {
  id: string;
  accountId: string;
  patientId: string;
  relationshipType: string;
  accessRole: string;
  isPrimaryProfile: boolean;
  isVerified: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
};

export type PatientContactRow = {
  id: string;
  patientId: string;
  contactType: string;
  value: string;
  countryCode: string | null;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt: string;
};

export type PatientAddressRow = {
  id: string;
  patientId: string;
  countryCode: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  isPrimary: boolean;
  createdAt: string;
};

/** V1.2: read directly off patient.audit_log -- "Timeline MUST aggregate
 * events rather than duplicate source data" (spec V1.2). */
export type PatientTimelineEventRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  occurredAt: string;
  metadata: Record<string, unknown>;
};

export type PatientNoteRow = {
  id: string;
  patientId: string;
  body: string;
  visibility: "admin" | "superadmin";
  status: "active" | "archived";
  authorId: string | null;
  createdAt: string;
  archivedAt: string | null;
};

/** V1.4 search: matchType tells the UI/caller how the result was found, and
 * ranks exact identifier/public-id matches above weak name matches -- per
 * spec V1.4, "exact identifiers MUST rank higher than weak demographic
 * matching." */
export type PatientSearchMatchType = "public_id" | "identifier" | "contact" | "name";

export type PatientSearchResultRow = PatientRow & {
  matchType: PatientSearchMatchType;
};

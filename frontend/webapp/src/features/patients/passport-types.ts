/**
 * Patient 360 V7.4 (International Patient Summary / "LSevin Patient
 * Passport"). See db/migrations/0056's patient.patient_passports.
 */

export const PASSPORT_SECTIONS = [
  "demographics",
  "allergies",
  "medications",
  "conditions",
  "procedures",
  "diagnostic_results",
  "imaging",
  "emergency_contact",
] as const;
export type PassportSection = (typeof PASSPORT_SECTIONS)[number];

export const PASSPORT_LANGUAGES = ["fa", "ar", "en", "tr"] as const;
export type PassportLanguage = (typeof PASSPORT_LANGUAGES)[number];

export type PatientPassportRow = {
  id: string;
  patientId: string;
  language: PassportLanguage;
  includedSections: string[];
  snapshot: Record<string, unknown>;
  fhirBundle: Record<string, unknown>;
  generatedBy: string | null;
  createdAt: string;
};

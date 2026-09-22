/**
 * Patient 360 V5 (Sharing, Consent, Family Access & Security). See
 * docs/LSevin_Patient_360_Spiral_Requirements.md and
 * db/migrations/0054_patient_sharing_consent_security.sql.
 */

export type PatientConsentRow = {
  id: string;
  patientId: string;
  consentType: string;
  purpose: string;
  recipientType: string;
  recipientId: string | null;
  scope: string[];
  validFrom: string;
  validUntil: string | null;
  consentStatus: "active" | "withdrawn" | "expired";
  documentId: string | null;
  grantedAt: string;
  withdrawnAt: string | null;
  createdAt: string;
};

export type ShareGrantRow = {
  id: string;
  patientId: string;
  medicalCaseId: string | null;
  createdBy: string | null;
  recipientName: string | null;
  recipientContact: string | null;
  scope: string[];
  validFrom: string;
  expiresAt: string;
  revokedAt: string | null;
  accessCount: number;
  maxAccessCount: number | null;
  createdAt: string;
};

/** Returned once, only at creation time -- never persisted or retrievable
 * again (spec V5.3: the token is the bearer secret). */
export type ShareGrantWithToken = ShareGrantRow & { token: string };

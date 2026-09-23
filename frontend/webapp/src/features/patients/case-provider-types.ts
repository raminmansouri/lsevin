/**
 * Patient 360: provider case-collaboration grants. See
 * docs/LSevin_Patient_360_Spiral_Requirements.md and
 * db/migrations/0059_patient_case_provider_grants.sql.
 */

export const CASE_PROVIDER_PERMISSIONS = ["view", "contribute"] as const;
export type CaseProviderPermission = (typeof CASE_PROVIDER_PERMISSIONS)[number];

export type CaseProviderGrantRow = {
  id: string;
  patientId: string;
  medicalCaseId: string;
  providerId: string;
  bookingId: string | null;
  permission: CaseProviderPermission;
  scope: string[];
  status: "active" | "revoked";
  grantedBy: string;
  grantedAt: string;
  revokedBy: string | null;
  revokedAt: string | null;
  createdAt: string;
};

/** A provider the customer has an actual booking with -- the only
 * candidates offered when sharing a case, so "share along the booking" is
 * enforced by what's selectable, not just by convention. */
export type BookedProviderOption = {
  providerId: string;
  providerName: string;
  bookingId: string;
};

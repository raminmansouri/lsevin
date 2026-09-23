/**
 * Patient 360: customer self-service family-member link requests. See
 * docs/LSevin_Patient_360_Spiral_Requirements.md and
 * db/migrations/0060_patient_account_link_requests.sql.
 */

export type AccountLinkRequestRow = {
  id: string;
  accountId: string;
  relationshipType: string;
  identifierType: string;
  identifierValueMasked: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  matchedPatientId: string | null;
  requestStatus: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
};

export type AccountLinkRequestWithMatch = AccountLinkRequestRow & {
  matchedPatientName: string | null;
};

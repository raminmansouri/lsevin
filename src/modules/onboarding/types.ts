export type ProviderTypeOption = { id: string; label: string; description: string };

export type ProviderApplication = {
  id: string;
  applicationNumber: string;
  providerTypeId?: string | null;
  providerTypeName: string;
  providerTypeExists?: boolean;
  applicantUserId?: string | null;
  applicantName?: string | null;
  applicantEmail?: string | null;
  legalName: string | null;
  displayName: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  reviewReason: string | null;
  internalNote?: string | null;
  createdAt: string;
  submittedAt: string | null;
  reviewedAt?: string | null;
  serviceProviderId: string | null;
  submissionPayload?: Record<string, unknown>;
};

export type AdminApplicationSummary = {
  total: number;
  submitted: number;
  inReview: number;
  approved: number;
  rejected: number;
  orphanedProviderTypes: number;
};

export type ExistingProviderOption = {
  id: string;
  label: string;
  providerTypeId: string;
  isActive: boolean;
};

export type ApplicationReviewEvent = {
  id: string;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  note: string | null;
  reviewerName: string | null;
  serviceProviderId: string | null;
  createdAt: string;
};

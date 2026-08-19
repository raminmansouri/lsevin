export const assignableAdminRoles = [
  "SUPERADMIN",
  "ADMIN",
  "PROVIDER_ADMIN",
  "FINANCE_ADMIN",
  "SUPPORT_ADMIN",
  "CONTENT_ADMIN",
  "ANALYTICS_ADMIN",
  "REVIEW_ADMIN",
  "CONVERSION_ADMIN",
] as const;

export type AssignableAdminRole = (typeof assignableAdminRoles)[number];

export type AdminGovernanceSummary = {
  totalUsers: number;
  activeUsers: number;
  usersWithAdminRoles: number;
  superadmins: number;
  administrators: number;
  scopedAdministrators: number;
  governanceEvents30d: number;
  catalogActions30d: number;
  onboardingDecisions30d: number;
};

export type AdminGovernanceUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  userState: string;
  roles: string[];
  lastLoggedInAt: string | null;
  providerMemberships: number;
};

export type GovernanceEvent = {
  id: string;
  action: string;
  roleName: string | null;
  reason: string;
  actorName: string;
  targetName: string;
  targetUserId: string;
  previousRoles: string[];
  newRoles: string[];
  createdAt: string;
};

export type UnifiedAdminAuditItem = {
  id: string;
  source: "governance" | "catalog" | "onboarding";
  action: string;
  entityLabel: string;
  actorName: string;
  reason: string | null;
  createdAt: string;
  detail: Record<string, unknown>;
};

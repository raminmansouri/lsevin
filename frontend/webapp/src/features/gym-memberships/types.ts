/**
 * Gym membership subscriptions (recurring/prepaid billing) — a new domain,
 * distinct from booking.bookings (a discrete date/slot booking). See
 * db/migrations/0039_gym_memberships.sql for the schema this reads/writes.
 *
 * Shared by the customer "my memberships" page, the subscribe form and the
 * admin panel, so it must stay free of server-only imports.
 */

export const GYM_MEMBERSHIPS_TRANSLATION_KEY = "GymMemberships";

export const MEMBERSHIP_STATUSES = ["active", "cancelled"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const MEMBERSHIP_MONTH_STATUSES = ["pending_review", "approved", "rejected"] as const;
export type MembershipMonthStatus = (typeof MEMBERSHIP_MONTH_STATUSES)[number];

export type GymMembershipPlan = {
  id: string;
  serviceProviderId: string;
  providerName: string;
  nameTranslations: Record<string, string>;
  name: string;
  monthlyPrice: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GymMembershipMonth = {
  id: string;
  membershipId: string;
  /** ISO date, always the first of the month, e.g. "2026-09-01". */
  periodMonth: string;
  amount: number;
  currency: string;
  status: MembershipMonthStatus;
  paymentReference: string | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  /** Derived, not stored: an unpaid month whose period has already started. */
  isDue: boolean;
};

export type GymMembership = {
  id: string;
  userId: string;
  membershipPlanId: string;
  serviceProviderId: string;
  providerName: string;
  planName: string;
  monthlyPrice: number;
  currency: string;
  status: MembershipStatus;
  createdAt: string;
  months: GymMembershipMonth[];
};

/** One row per month, flattened with its membership/plan/customer context — the shape the
 * admin review queue and "all subscriptions" overview both need. */
export type GymMembershipMonthAdminRow = GymMembershipMonth & {
  userId: string;
  providerName: string;
  planName: string;
};

export type GymMembershipMonthListFilters = {
  status: MembershipMonthStatus | "all";
  search: string;
  pageNumber: number;
  pageSize: number;
};

export type GymMembershipMonthListResult = {
  items: GymMembershipMonthAdminRow[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type GymMembershipsAdminPageData = {
  plans: GymMembershipPlan[];
  months: GymMembershipMonthListResult;
  filters: GymMembershipMonthListFilters;
  /** True when migration 0039 has not been applied yet -- the runner here is manual, so a
   * deploy can legitimately land before the migration does (same convention consultation
   * already uses for its own schemaMissing flag). */
  schemaMissing: boolean;
};

/** Uniform result shape for every action in this feature -- flat rather than a
 * `{ok:true}|{ok:false}` union because the project compiles with `strict: false`; without
 * `strictNullChecks` a boolean discriminant wouldn't narrow the union (same reasoning
 * consultation's own ConsultationActionResult documents). */
export type GymMembershipActionResult<T = undefined> = {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

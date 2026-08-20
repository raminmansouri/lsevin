/**
 * Free-consultation requests — the callback leads raised from the booking wizard.
 *
 * Shared by the customer form, the API route and the admin panel, so it must stay
 * free of server-only imports.
 */

export const CONSULTATION_TRANSLATION_KEY = "Consultation";

export const CONSULTATION_STATUSES = [
  "new",
  "in_progress",
  "contacted",
  "done",
  "rejected",
] as const;
export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

export const CONSULTATION_URGENCIES = ["normal", "soon", "urgent"] as const;
export type ConsultationUrgency = (typeof CONSULTATION_URGENCIES)[number];

export const CONSULTATION_CONTACT_TIMES = [
  "any",
  "morning",
  "afternoon",
  "evening",
] as const;
export type ConsultationContactTime = (typeof CONSULTATION_CONTACT_TIMES)[number];

/** Where the lead was raised. Only one entry point exists today. */
export const CONSULTATION_SOURCES = ["booking_wizard"] as const;
export type ConsultationSource = (typeof CONSULTATION_SOURCES)[number];

export type ConsultationNotificationStatus =
  | "pending"
  | "sent"
  | "failed"
  /** Deliberately not sent — no pattern id configured, or SMS switched off. Not a failure. */
  | "skipped";

export type ConsultationNotification = {
  id: string;
  recipientType: "customer" | "admin";
  phone: string;
  channel: "sms";
  bodyId: string | null;
  variables: string | null;
  status: ConsultationNotificationStatus;
  providerMessageId: string | null;
  errorMessage: string | null;
  skipReason: string | null;
  attemptedAt: string | null;
  createdAt: string;
};

export type ConsultationRequest = {
  id: string;
  userId: string | null;
  bookingDraftId: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  phoneCountryCode: string | null;
  email: string | null;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
  preferredContactTime: ConsultationContactTime;
  urgency: ConsultationUrgency;
  locale: string | null;
  source: string;
  status: ConsultationStatus;
  adminNote: string | null;
  assignedToUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConsultationRequestDetail = ConsultationRequest & {
  notifications: ConsultationNotification[];
};

export type ConsultationRequestListItem = ConsultationRequest & {
  /** Rolled up per request so the table can flag delivery trouble without a second query. */
  notificationsSent: number;
  notificationsFailed: number;
  notificationsSkipped: number;
};

export type ConsultationRecipient = {
  id: string;
  label: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * The MeliPayamak account has no free-text sender line, so every message has to
 * quote a pattern id that was approved in the provider's panel. Both ids are null
 * until those patterns exist; sending is skipped while they are.
 */
export type ConsultationSmsSettings = {
  enabled: boolean;
  customerBodyId: string | null;
  adminBodyId: string | null;
  rateLimitPerHour: number;
};

export type ConsultationStats = {
  total: number;
  newCount: number;
  inProgressCount: number;
  contactedCount: number;
  doneCount: number;
  rejectedCount: number;
  failedNotifications: number;
};

export type ConsultationListFilters = {
  status: ConsultationStatus | "all";
  urgency: ConsultationUrgency | "all";
  search: string;
  pageNumber: number;
  pageSize: number;
};

export type ConsultationListResult = {
  items: ConsultationRequestListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type ConsultationAdminPageData = {
  list: ConsultationListResult;
  stats: ConsultationStats;
  recipients: ConsultationRecipient[];
  smsSettings: ConsultationSmsSettings;
  filters: ConsultationListFilters;
  /**
   * True when migration 0019 has not been applied yet. The page renders an
   * explanatory panel instead of crashing on a missing relation — the runner is
   * manual here, so a deploy can legitimately land before the migration does.
   */
  schemaMissing: boolean;
};

/**
 * Uniform result shape for every action in this feature.
 *
 * Flat rather than a `{ok:true}|{ok:false}` union because the project compiles with
 * `strict: false`; without `strictNullChecks`, TypeScript will not narrow a union by
 * a boolean discriminant, so callers doing `if (!result.ok) show(result.error)`
 * would not typecheck.
 */
export type ConsultationActionResult<T = undefined> = {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

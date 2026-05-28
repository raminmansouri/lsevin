export const BUG_REPORT_STATUSES = [
  "open",
  "triaged",
  "in_progress",
  "need_info",
  "resolved",
  "closed",
  "duplicate",
  "wont_fix",
] as const;

export const BUG_REPORT_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export const BUG_REPORT_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const BUG_REPORT_AREAS = [
  "booking",
  "admin",
  "customer_app",
  "provider_portal",
  "payment",
  "media",
  "website",
  "other",
] as const;

export type BugReportStatus = (typeof BUG_REPORT_STATUSES)[number];
export type BugReportPriority = (typeof BUG_REPORT_PRIORITIES)[number];
export type BugReportSeverity = (typeof BUG_REPORT_SEVERITIES)[number];
export type BugReportArea = (typeof BUG_REPORT_AREAS)[number];

export type BugReportAttachment = {
  id?: string;
  mediaId?: string | null;
  fileUrl: string;
  fileName: string;
  mimeType?: string | null;
  mediaType: "image" | "video" | "file";
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
};

export type BugReportCard = {
  id: string;
  reportNumber: string;
  title: string;
  description: string;
  sourceArea: BugReportArea;
  sourceUrl: string | null;
  status: BugReportStatus;
  priority: BugReportPriority;
  severity: BugReportSeverity;
  assignedToUserId: string | null;
  customerUserId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  createDate: string;
  lastModifiedDate: string;
  resolvedAt: string | null;
  conversationNumber: string;
  unreadForAdminCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  mediaCount: number;
  messageCount: number;
};

export type BugReportMessage = {
  id: string;
  senderType: "customer" | "agent" | "system";
  senderUserId: string | null;
  body: string | null;
  messageType: "text" | "image" | "file" | "system" | "note";
  isInternalNote: boolean;
  attachments: BugReportAttachment[];
  createDate: string;
};

export type BugReportDetails = BugReportCard & {
  expectedBehavior: string | null;
  actualBehavior: string | null;
  reproductionSteps: string[];
  bookingId: string | null;
  providerId: string | null;
  serviceId: string | null;
  specialistId: string | null;
  browserName: string | null;
  operatingSystem: string | null;
  deviceType: string | null;
  appVersion: string | null;
  environment: Record<string, unknown>;
  resolutionNote: string | null;
  resolvedByUserId: string | null;
  conversationId: string;
  messages: BugReportMessage[];
  media: BugReportAttachment[];
};

export type CustomerBugReportListItem = Pick<
  BugReportCard,
  | "id"
  | "reportNumber"
  | "title"
  | "status"
  | "priority"
  | "severity"
  | "sourceArea"
  | "createDate"
  | "lastMessagePreview"
  | "lastMessageAt"
  | "unreadForAdminCount"
> & {
  unreadForCustomerCount: number;
};

export type AdminBugReportFilters = {
  q: string;
  status: BugReportStatus | "all";
  severity: BugReportSeverity | "all";
  priority: BugReportPriority | "all";
  area: BugReportArea | "all";
};

export type ActionResult<T = unknown> =
  | { ok: true; data: T; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

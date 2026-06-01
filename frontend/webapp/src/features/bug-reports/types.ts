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

export type BugReportPerson = {
  userId: string | null;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  role: "customer" | "agent" | "admin" | "system" | "guest";
};

export type BugReportBoardColumn = {
  key: string;
  statuses: BugReportStatus[];
  title: string;
  labelTranslations: Record<string, string>;
  displayOrder: number;
  isEnabled: boolean;
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
  assignedToDisplayName: string | null;
  customerUserId: string | null;
  customerDisplayName: string | null;
  customerEmail: string | null;
  guestName: string | null;
  guestEmail: string | null;
  createDate: string;
  lastModifiedDate: string;
  resolvedAt: string | null;
  conversationNumber: string;
  unreadForAdminCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  lastMessageAuthorName: string | null;
  lastMessageAuthorRole: string | null;
  updatedByOtherAt: string | null;
  updatedByOtherBy: string | null;
  updatedByOtherEventType: string | null;
  mediaCount: number;
  messageCount: number;
};

export type BugReportMessage = {
  id: string;
  senderType: "customer" | "agent" | "system";
  senderUserId: string | null;
  sender: BugReportPerson;
  body: string | null;
  messageType: "text" | "image" | "file" | "system" | "note";
  isInternalNote: boolean;
  attachments: BugReportAttachment[];
  createDate: string;
};

export type BugReportUpdate = {
  id: string;
  eventType: string;
  actor: BugReportPerson;
  fromValue: string | null;
  toValue: string | null;
  title: string;
  body: string | null;
  isInternal: boolean;
  createDate: string;
};


export type BugReportRecentChange = {
  id: string;
  bugReportId: string;
  reportNumber: string;
  title: string;
  eventType: string;
  actorName: string;
  fromValue: string | null;
  toValue: string | null;
  createDate: string;
};

export type BugReportAssignableAgent = {
  userId: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  status: "online" | "away" | "offline" | string;
};

export type BugReportDetails = BugReportCard & {
  currentViewerUserId: string | null;
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
  resolvedByDisplayName: string | null;
  conversationId: string;
  messages: BugReportMessage[];
  updates: BugReportUpdate[];
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

export type AdminBugReportView = "board" | "list";
export type AdminBugReportOwnershipFilter = "all" | "assigned_to_me" | "unassigned";

export type AdminBugReportFilters = {
  q: string;
  status: BugReportStatus | "all";
  severity: BugReportSeverity | "all";
  priority: BugReportPriority | "all";
  area: BugReportArea | "all";
  page: number;
  pageSize: number;
  view: AdminBugReportView;
  ownership: AdminBugReportOwnershipFilter;
};

export type AdminBugReportPageInfo = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ActionResult<T = unknown> =
  | { ok: true; data: T; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

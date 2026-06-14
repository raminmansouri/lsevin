export type NotificationType = "booking" | "offer" | "system";
export type NotificationChannel = "in_app" | "email" | "sms" | "push" | "phone_call";
export type TranslationRecord = Record<string, string>;

export const NOTIFICATION_TYPES: NotificationType[] = ["booking", "offer", "system"];
export const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  "in_app",
  "email",
  "sms",
  "push",
  "phone_call",
];

export type AdminNotificationTemplate = {
  id: string;
  templateKey: string;
  name: string;
  description: string | null;
  notificationType: NotificationType;
  defaultChannels: NotificationChannel[];
  titleTranslations: TranslationRecord;
  bodyTranslations: TranslationRecord;
  emailSubjectTranslations: TranslationRecord;
  emailBodyTranslations: TranslationRecord;
  smsBodyTranslations: TranslationRecord;
  pushTitleTranslations: TranslationRecord;
  pushBodyTranslations: TranslationRecord;
  variables: string[];
  isActive: boolean;
  metadata: Record<string, unknown>;
  previewTitle: string;
  previewBody: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminNotificationTemplateListItem = AdminNotificationTemplate;

export type AdminNotificationTemplateStats = {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  bookingCount: number;
  offerCount: number;
  systemCount: number;
};

export type AdminNotificationTemplateFilterParams = {
  pageNumber?: number;
  pageSize?: number;
  filters?: string;
  notificationType?: "all" | NotificationType;
  isActive?: "all" | "active" | "inactive";
  channel?: "all" | NotificationChannel;
};

export type PaginatedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  currentStartIndex: number;
  currentEndIndex: number;
};

export type AdminNotificationTemplatesPageData = {
  items: AdminNotificationTemplateListItem[];
  stats: AdminNotificationTemplateStats;
  pagination: PaginatedResult<AdminNotificationTemplateListItem>;
  filters: Required<AdminNotificationTemplateFilterParams>;
  tableMissing: boolean;
};

export type SaveAdminNotificationTemplateInput = {
  id?: string | null;
  templateKey: string;
  name: string;
  description?: string | null;
  notificationType: NotificationType;
  defaultChannels: NotificationChannel[];
  titleTranslations: TranslationRecord;
  bodyTranslations: TranslationRecord;
  emailSubjectTranslations: TranslationRecord;
  emailBodyTranslations: TranslationRecord;
  smsBodyTranslations: TranslationRecord;
  pushTitleTranslations: TranslationRecord;
  pushBodyTranslations: TranslationRecord;
  variables: string[];
  isActive: boolean;
  metadata?: Record<string, unknown>;
};

import type { SUPPORT_PRIORITY_OPTIONS, SUPPORT_SOURCE_OPTIONS, SUPPORT_STATUS_OPTIONS } from "./constants";

export type SupportStatus = (typeof SUPPORT_STATUS_OPTIONS)[number];
export type SupportPriority = (typeof SUPPORT_PRIORITY_OPTIONS)[number];
export type SupportSource = (typeof SUPPORT_SOURCE_OPTIONS)[number];
export type SupportSenderType = "customer" | "agent" | "system";
export type SupportMessageType = "text" | "image" | "file" | "system" | "note";
export type SupportAgentStatus = "online" | "away" | "offline";
export type SupportLauncherPosition = "bottom-right" | "bottom-left";
export type SupportThemeMode = "system" | "light" | "dark";

export type LocalizedSupportLabels = Record<
  string,
  {
    launcherLabel?: string;
    headerTitle?: string;
    headerSubtitle?: string;
    welcomeTitle?: string;
    welcomeMessage?: string;
    inputPlaceholder?: string;
    startConversationLabel?: string;
    offlineLabel?: string;
    onlineLabel?: string;
    sendButton?: string;
    attachmentLabel?: string;
  }
>;

export type SupportSettings = {
  id: number;
  floatingChatEnabled: boolean;
  supportPageEnabled: boolean;
  requireLogin: boolean;
  allowGuestConversation: boolean;
  showOnAppPages: boolean;
  showOnBookingPages: boolean;
  showOnProviderPages: boolean;
  showOnAdminPages: boolean;
  launcherPosition: SupportLauncherPosition;
  launcherIcon: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  borderRadius: string;
  themeMode: SupportThemeMode;
  compactMode: boolean;
  labels: LocalizedSupportLabels;
  officeHours: Record<string, unknown>;
  offlineSettings: Record<string, unknown>;
  autoReplySettings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createDate?: string;
  lastModifiedDate?: string;
};

export type SupportAttachment = {
  id?: string;
  url: string;
  name?: string;
  mimeType?: string;
  sizeBytes?: number;
  mediaType?: "image" | "video" | "file";
};

export type SupportMessage = {
  id: string;
  conversationId: string;
  senderType: SupportSenderType;
  senderUserId?: string | null;
  body?: string | null;
  bodyJson: Record<string, unknown>;
  messageType: SupportMessageType;
  isInternalNote: boolean;
  attachments: SupportAttachment[];
  readAt?: string | null;
  deliveredAt?: string | null;
  metadata: Record<string, unknown>;
  createDate: string;
  editedAt?: string | null;
  deletedAt?: string | null;
};

export type SupportTag = {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  createDate?: string;
  lastModifiedDate?: string;
};

export type SupportConversationListItem = {
  id: string;
  conversationNumber: string;
  customerUserId?: string | null;
  customerId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhoneCountryCode?: string | null;
  guestPhone?: string | null;
  displayName: string;
  displayContact?: string | null;
  source: SupportSource;
  sourceUrl?: string | null;
  locale?: string | null;
  status: SupportStatus;
  priority: SupportPriority;
  assignedToUserId?: string | null;
  assignedAgentName?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  unreadForAdminCount: number;
  unreadForCustomerCount: number;
  tags: SupportTag[];
  createDate: string;
  lastModifiedDate: string;
  closedAt?: string | null;
};

export type SupportConversationDetail = SupportConversationListItem & {
  messages: SupportMessage[];
  events: SupportConversationEvent[];
};

export type SupportConversationEvent = {
  id: string;
  conversationId: string;
  actorUserId?: string | null;
  eventType: string;
  fromValue?: string | null;
  toValue?: string | null;
  metadata: Record<string, unknown>;
  createDate: string;
};

export type SupportCannedReply = {
  id: string;
  title: string;
  shortcut?: string | null;
  bodyTranslations: Record<string, string>;
  isActive: boolean;
  displayOrder: number;
  createDate?: string;
  lastModifiedDate?: string;
};

export type SupportAgent = {
  userId: string;
  status: SupportAgentStatus;
  displayName?: string | null;
  avatarUrl?: string | null;
  lastSeenAt: string;
};

export type SupportPagination = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type SupportConversationListResult = {
  items: SupportConversationListItem[];
  pagination: SupportPagination;
};

export type SupportActionError = {
  title: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
};

export type SupportActionResult<T> = {
  data?: T;
  error?: SupportActionError;
  fieldErrors?: Record<string, string[]>;
};

export type SupportBootstrapData = {
  settings: SupportSettings;
  activeConversation?: SupportConversationDetail | null;
  onlineAgents: SupportAgent[];
};

export type NotificationChannel = "in_app" | "email" | "sms" | "push";

export type TemplateNotificationPayload = {
  recipientEntityType: string;
  recipientEntityId: string;
  templateKey: string;
  audienceKey?: string;
  locale?: string;
  variables?: Record<string, string | number | boolean | null | undefined>;
  sourceEntityType?: string;
  sourceEntityId?: string;
  sourceModule?: string;
};

export type TemplateNotificationResult = {
  delivered: boolean;
  skipped: boolean;
  reason?: "template_missing" | "template_inactive" | "notifications_disabled" | "subscription_disabled" | "no_supported_channels" | "capability_unavailable" | "dispatch_failed";
  templateKey: string;
  channels: NotificationChannel[];
};

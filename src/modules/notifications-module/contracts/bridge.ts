export type LSevinNotificationEventPayload = {
  eventName: string;
  recipientEntityType: "provider" | "staff" | "customer" | "admin";
  recipientEntityId: string;
  title: string;
  body: string;
  templateKey?: string;
  channel?: "in_app" | "email" | "sms" | "push";
  sourceModule?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  locale?: string;
  metadata?: Record<string, unknown>;
};

export type SubscribeAudiencePayload = {
  recipientEntityType: "provider" | "staff" | "customer";
  recipientEntityId: string;
  audienceKey: string;
  channel?: "in_app" | "email" | "sms" | "push";
  locale?: string;
};

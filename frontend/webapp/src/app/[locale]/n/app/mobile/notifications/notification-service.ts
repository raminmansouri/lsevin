import sql from "@/config/database/db";

export type NotificationChannel =
  | "in_app"
  | "email"
  | "sms"
  | "push"
  | "phone_call";

export type SendNotificationInput = {
  customerId: string;
  notificationType: "booking" | "offer" | "system";
  title: string;
  body: string;
  channels: NotificationChannel[];
  entityType?: string | null;
  entityId?: string | null;
  data?: Record<string, unknown> | null;
  emailTo?: string | null;
  phoneTo?: string | null;
  pushToken?: string | null;
};

export async function createNotification(input: SendNotificationInput) {
  const [notification] = await sql<{ id: string }[]>`
    insert into notify.notifications (
      customer_id,
      notification_type,
      title,
      body,
      entity_type,
      entity_id,
      payload,
      status
    )
    values (
      ${input.customerId}::uuid,
      ${input.notificationType},
      ${input.title},
      ${input.body},
      ${input.entityType ?? null},
      ${input.entityId ? sql`${input.entityId}::uuid` : null},
      ${JSON.stringify(input.data ?? {})}::jsonb,
      'queued'
    )
    returning id::text as id
  `;

  for (const channel of input.channels) {
    await sql`
      insert into notify.notification_deliveries (
        notification_id,
        channel,
        recipient_email,
        recipient_phone,
        recipient_push_token,
        status
      )
      values (
        ${notification.id}::uuid,
        ${channel},
        ${input.emailTo ?? null},
        ${input.phoneTo ?? null},
        ${input.pushToken ?? null},
        'pending'
      )
    `;
  }

  return notification.id;
}

export async function queueBookingCreatedNotifications(input: {
  customerId: string;
  providerId: string;
  bookingId: string;
  title: string;
  body: string;
  emailTo?: string | null;
  phoneTo?: string | null;
  pushToken?: string | null;
}) {
  return createNotification({
    customerId: input.customerId,
    notificationType: "booking",
    title: input.title,
    body: input.body,
    entityType: "booking",
    entityId: input.bookingId,
    channels: ["in_app", "email", "sms", "push"],
    emailTo: input.emailTo,
    phoneTo: input.phoneTo,
    pushToken: input.pushToken,
    data: { providerId: input.providerId, bookingId: input.bookingId },
  });
}

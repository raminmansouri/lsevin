import "server-only";

import sql from "@/config/database/db";
import { listChannelConfigsForDispatch, type NotificationChannelCode } from "./channel.repository";
import { sendEmail } from "./senders/email";
import { sendSms } from "./senders/sms";
import { sendPush } from "./senders/push";
import { sendWhatsapp } from "./senders/whatsapp";
import { sendBale } from "./senders/bale";
import type { DeliveryToSend, SendResult } from "./senders/types";

type SendableChannel = Exclude<NotificationChannelCode, "in_app">;

const SENDERS: Record<SendableChannel, (delivery: DeliveryToSend, settings: any) => Promise<SendResult>> = {
  email: sendEmail,
  sms: sendSms,
  push: sendPush,
  whatsapp: sendWhatsapp,
  bale: sendBale,
};

type ClaimedDeliveryRow = {
  id: string;
  notificationId: string;
  channel: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  payload: { channelContent?: DeliveryToSend["channelContent"] } | null;
  recipientUserId: string | null;
};

export type DispatchResult = { processed: number; sent: number; failed: number; cancelled: number };

/**
 * Claims a batch of queued (non in_app) deliveries with `for update skip locked` --
 * safe to call concurrently from multiple processes/instances, since a locked row is
 * simply skipped rather than double-claimed. in_app deliveries are never claimed here:
 * createNotification/createNotificationFromTemplate already mark them 'sent'
 * immediately at creation time, since "delivered" for in_app just means the row exists.
 */
export async function dispatchQueuedDeliveries(batchSize = 20): Promise<DispatchResult> {
  const claimed = await sql<ClaimedDeliveryRow[]>`
    update notify.notification_deliveries
    set status = 'processing', attempted_at = now()
    where id in (
      select id from notify.notification_deliveries
      where status = 'queued' and channel <> 'in_app'
      order by created_at asc
      limit ${batchSize}
      for update skip locked
    )
    returning id::text as id, notification_id::text as "notificationId", channel,
      recipient_email as "recipientEmail", recipient_phone as "recipientPhone"
  `;

  if (!claimed.length) return { processed: 0, sent: 0, failed: 0, cancelled: 0 };

  const notificationIds = Array.from(new Set(claimed.map((row) => row.notificationId)));
  const notifications = await sql<NotificationRow[]>`
    select id::text as id, title, body, payload,
           coalesce(recipient_user_id, customer_id)::text as "recipientUserId"
    from notify.notifications
    where id = any(${notificationIds}::uuid[])
  `;
  const notificationById = new Map(notifications.map((row) => [row.id, row]));
  const channels = await listChannelConfigsForDispatch();

  let sent = 0;
  let failed = 0;
  let cancelled = 0;

  for (const row of claimed) {
    const channelCode = row.channel as NotificationChannelCode;
    const channelConfig = channels.get(channelCode);
    const notification = notificationById.get(row.notificationId);

    if (!channelConfig?.isEnabled) {
      await markDelivery(row.id, "cancelled", { errorMessage: "Channel disabled by admin" });
      cancelled += 1;
      continue;
    }

    if (!notification) {
      await markDelivery(row.id, "failed", { errorMessage: "Notification not found" });
      failed += 1;
      continue;
    }

    const sender = SENDERS[channelCode as SendableChannel];
    if (!sender) {
      await markDelivery(row.id, "cancelled", { errorMessage: `No sender implemented for channel "${channelCode}"` });
      cancelled += 1;
      continue;
    }

    const delivery: DeliveryToSend = {
      id: row.id,
      notificationId: row.notificationId,
      channel: channelCode as DeliveryToSend["channel"],
      recipientEmail: row.recipientEmail,
      recipientPhone: row.recipientPhone,
      recipientUserId: notification.recipientUserId,
      title: notification.title,
      body: notification.body,
      channelContent: notification.payload?.channelContent ?? {},
    };

    let result: SendResult;
    try {
      result = await sender(delivery, channelConfig.settings);
    } catch (error) {
      result = { ok: false, error: error instanceof Error ? error.message : "Unknown sender error" };
    }

    if (result.ok) {
      await markDelivery(row.id, "sent", { providerResponse: result.providerResponse ?? null });
      sent += 1;
    } else {
      await markDelivery(row.id, "failed", { errorMessage: result.error ?? "Unknown error" });
      failed += 1;
    }
  }

  return { processed: claimed.length, sent, failed, cancelled };
}

async function markDelivery(
  id: string,
  status: "sent" | "failed" | "cancelled",
  extra: { providerResponse?: string | null; errorMessage?: string | null } = {}
) {
  if (status === "sent") {
    await sql`
      update notify.notification_deliveries
      set status = 'sent', delivered_at = now(), provider_response = ${extra.providerResponse ?? null}
      where id = ${id}::uuid
    `;
    return;
  }

  await sql`
    update notify.notification_deliveries
    set status = ${status}, failed_at = now(), error_message = ${extra.errorMessage ?? null}
    where id = ${id}::uuid
  `;
}

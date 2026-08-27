import "server-only";

import webpush from "web-push";

import sql from "@/config/database/db";
import type { NotificationChannelSettings } from "../channel.repository";
import type { DeliveryToSend, SendResult } from "./types";

export async function sendPush(delivery: DeliveryToSend, settings: NotificationChannelSettings): Promise<SendResult> {
  if (!delivery.recipientUserId) return { ok: false, error: "No recipient user to resolve a push subscription for." };
  if (!settings.vapidPublicKey || !settings.vapidPrivateKey) {
    return { ok: false, error: "VAPID keys are not configured." };
  }

  const subscriptions = await sql<{ endpoint: string; p256dh: string; auth: string }[]>`
    select endpoint, p256dh, auth
    from notify.push_subscriptions
    where user_id = ${delivery.recipientUserId}::uuid
  `;
  if (!subscriptions.length) return { ok: false, error: "Recipient has no push subscription." };

  webpush.setVapidDetails(
    settings.vapidSubject?.trim() || "mailto:admin@lsevin.com",
    settings.vapidPublicKey,
    settings.vapidPrivateKey
  );

  const title = delivery.channelContent?.push?.title || delivery.title;
  const body = delivery.channelContent?.push?.body || delivery.body;
  const payload = JSON.stringify({ title, body });

  let successCount = 0;
  const errors: string[] = [];

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        payload
      );
      successCount += 1;
    } catch (error) {
      // 404/410 means the browser dropped the subscription (uninstalled, permission
      // revoked, cleared storage) -- it will never succeed again, so stop retrying it.
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await sql`delete from notify.push_subscriptions where endpoint = ${subscription.endpoint}`;
      }
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (successCount > 0) {
    return { ok: true, providerResponse: `${successCount}/${subscriptions.length} subscriptions notified` };
  }
  return { ok: false, error: errors.join("; ") || "Push send failed." };
}

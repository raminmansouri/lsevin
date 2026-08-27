import "server-only";

import { readMeliPayamakCredentials, sendSimpleSms, type MeliPayamakCredentials } from "@/features/consultation/server/melipayamak";

import type { NotificationChannelSettings } from "../channel.repository";
import type { DeliveryToSend, SendResult } from "./types";

export async function sendSms(delivery: DeliveryToSend, settings: NotificationChannelSettings): Promise<SendResult> {
  if (!delivery.recipientPhone) return { ok: false, error: "No recipient phone number." };

  const credentials: MeliPayamakCredentials | null =
    settings.smsUsername && settings.smsPassword
      ? {
          username: settings.smsUsername,
          password: settings.smsPassword,
          baseUrl: (settings.smsBaseUrl?.trim() || "https://rest.payamak-panel.com/api/").replace(/\/?$/, "/"),
        }
      : readMeliPayamakCredentials();

  if (!credentials) return { ok: false, error: "SMS provider is not configured." };

  const body = delivery.channelContent?.sms?.body || delivery.body;
  const result = await sendSimpleSms({ to: delivery.recipientPhone, text: body, credentials });
  return result.ok ? { ok: true, providerResponse: result.messageId } : { ok: false, error: result.error };
}

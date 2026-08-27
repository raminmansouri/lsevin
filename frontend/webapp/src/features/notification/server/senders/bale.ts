import "server-only";

import { getBaleLink } from "../subscriptions.repository";
import type { NotificationChannelSettings } from "../channel.repository";
import type { DeliveryToSend, SendResult } from "./types";

/**
 * Bale's bot API is Telegram-Bot-API-compatible: a bot can only message a chat that
 * has already messaged it first (via /start), so this looks up the chat id the
 * recipient linked earlier (see subscriptions.repository.ts / the /api/webhooks/bale
 * route) rather than sending by phone number.
 */
export async function sendBale(delivery: DeliveryToSend, settings: NotificationChannelSettings): Promise<SendResult> {
  if (!delivery.recipientUserId) return { ok: false, error: "No recipient user to resolve a Bale chat id for." };

  const botToken = settings.baleBotToken?.trim();
  if (!botToken) return { ok: false, error: "Bale bot token is not configured." };

  const link = await getBaleLink(delivery.recipientUserId);
  if (!link) return { ok: false, error: "Recipient has not linked Bale." };

  const text = delivery.channelContent?.bale?.body || delivery.body;

  try {
    const response = await fetch(`https://tapi.bale.ai/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: link.chatId, text }),
      cache: "no-store",
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.ok) {
      return { ok: false, error: json?.description || `HTTP ${response.status}` };
    }

    return { ok: true, providerResponse: String(json?.result?.message_id ?? "") };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown network error" };
  }
}

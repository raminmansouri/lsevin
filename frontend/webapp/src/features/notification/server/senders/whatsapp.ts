import "server-only";

import type { NotificationChannelSettings } from "../channel.repository";
import type { DeliveryToSend, SendResult } from "./types";

const DEFAULT_BASE_URL = "https://api.whatsiplus.com/";

/**
 * WhatsiPlus, not Meta's WhatsApp Business Cloud API -- the .NET Identity module
 * already sends international OTP through this same provider (see
 * src/Modules/Identity/.../HttpClients/Whatsiplus/WhatsplusApiClient.cs), so this
 * mirrors that client's request shape instead of standing up a second, unrelated
 * WhatsApp integration: POST multipart to `sendMsg/{apiKey}` with `phonenumber` and
 * `message`, response `{ messageId, message, success: "true"|"false" }`.
 */
export async function sendWhatsapp(delivery: DeliveryToSend, settings: NotificationChannelSettings): Promise<SendResult> {
  if (!delivery.recipientPhone) return { ok: false, error: "No recipient phone number." };

  const apiKey = settings.whatsappApiKey?.trim() || process.env.WHATSIPLUS_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "WhatsiPlus API key is not configured." };

  const baseUrl = (settings.whatsappBaseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/?$/, "/");
  const message = delivery.channelContent?.whatsapp?.body || delivery.body;

  const formData = new FormData();
  formData.append("phonenumber", delivery.recipientPhone);
  formData.append("message", message);

  try {
    const response = await fetch(new URL(`sendMsg/${apiKey}`, baseUrl), {
      method: "POST",
      body: formData,
      cache: "no-store",
    });
    const raw = await response.text();

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}: ${raw.slice(0, 200)}` };
    }

    let payload: { success?: string; message?: string; messageId?: number } | null = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      return { ok: false, error: `Unparsable response: ${raw.slice(0, 200)}` };
    }

    const success = String(payload?.success ?? "").toLowerCase() === "true";
    if (!success) return { ok: false, error: payload?.message || "WhatsiPlus reported failure." };

    return { ok: true, providerResponse: String(payload?.messageId ?? "") };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown network error" };
  }
}

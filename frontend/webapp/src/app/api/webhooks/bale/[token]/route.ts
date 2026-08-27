import { NextRequest, NextResponse } from "next/server";

import { getChannelConfig } from "@/features/notification/server/channel.repository";
import { resolveBaleLinkCode } from "@/features/notification/server/subscriptions.repository";

/**
 * The webhook URL registered with Bale embeds the bot token in the path
 * (`/api/webhooks/bale/{token}`) rather than a separate secret header -- the same
 * pattern many minimal Telegram-Bot-API-compatible integrations use, since the token
 * is already the credential that lets anyone act as the bot. Only requests whose path
 * token matches the admin-configured token are processed.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const channel = await getChannelConfig("bale", true);
  const configuredToken = channel?.settings.baleBotToken?.trim();

  if (!configuredToken || token !== configuredToken) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json().catch(() => null);
  const text = String(update?.message?.text || "").trim();
  const chatId = update?.message?.chat?.id;

  const match = /^\/start\s+([A-Za-z0-9]+)$/.exec(text);
  if (match && chatId != null) {
    await resolveBaleLinkCode({ code: match[1], chatId: String(chatId) }).catch((error) => {
      console.error("Bale link code resolution failed", error);
    });
  }

  // Webhooks are expected to answer quickly with 200 regardless of outcome; Bale/
  // Telegram-style bots retry aggressively on non-2xx responses.
  return NextResponse.json({ ok: true });
}

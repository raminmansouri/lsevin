import { NextResponse } from "next/server";
import { recordLSevinNotificationEvent } from "./repository";

function isBridgeAuthorized(request: Request) {
  const configuredKey = process.env.LSEVIN_NOTIFICATION_BRIDGE_KEY;
  if (!configuredKey && process.env.NODE_ENV !== "production") return true;
  return Boolean(configuredKey && request.headers.get("x-lsevin-bridge-key") === configuredKey);
}

async function parseJson(request: Request) {
  try { return await request.json(); } catch { return {}; }
}

export async function handleLSevinNotificationEvent({ request }: { request: Request; params: Record<string, string> }) {
  if (!isBridgeAuthorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized notification bridge request" }, { status: 401 });
  const body = await parseJson(request);
  const event = await recordLSevinNotificationEvent({
    eventName: String(body.eventName || "lsevin.event"),
    recipientEntityType: String(body.recipientEntityType || "provider"),
    recipientEntityId: String(body.recipientEntityId || body.providerId || "00000000-0000-0000-0000-000000000000"),
    title: String(body.title || "LSevin update"),
    body: String(body.body || "A new LSevin platform event was received."),
    templateKey: body.templateKey ? String(body.templateKey) : undefined,
    channel: body.channel ? String(body.channel) : "in_app",
    sourceModule: body.sourceModule ? String(body.sourceModule) : "lsevin-platform",
    sourceEntityType: body.sourceEntityType ? String(body.sourceEntityType) : undefined,
    sourceEntityId: body.sourceEntityId ? String(body.sourceEntityId) : undefined,
    locale: body.locale ? String(body.locale) : "fa-IR",
    metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : {},
  });
  return NextResponse.json({ ok: true, data: event });
}

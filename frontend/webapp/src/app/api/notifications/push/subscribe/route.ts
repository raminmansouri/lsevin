import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api-guard";
import { removePushSubscription, savePushSubscription } from "@/features/notification/server/subscriptions.repository";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const endpoint = String(body?.endpoint || "").trim();
  const p256dh = String(body?.keys?.p256dh || "").trim();
  const authKey = String(body?.keys?.auth || "").trim();

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  await savePushSubscription({ userId: auth.userId, endpoint, p256dh, auth: authKey });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const endpoint = String(body?.endpoint || "").trim();
  if (!endpoint) return NextResponse.json({ error: "endpoint is required." }, { status: 400 });

  await removePushSubscription(endpoint);
  return NextResponse.json({ ok: true });
}

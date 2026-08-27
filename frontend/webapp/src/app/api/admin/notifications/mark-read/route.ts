import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api-guard";
import { markAllNotificationsRead, markNotificationRead } from "@/features/notification/db/admin-notification-count.queries";

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const notificationId = String(body?.notificationId || "").trim();

  if (notificationId) {
    await markNotificationRead({ notificationId, userId: auth.userId });
  } else {
    await markAllNotificationsRead(auth.userId);
  }

  return NextResponse.json({ ok: true });
}

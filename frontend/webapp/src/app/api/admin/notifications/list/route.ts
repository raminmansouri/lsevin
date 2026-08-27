import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api-guard";
import { listNotificationsForRecipientUser } from "@/features/notification/db/admin-notification-count.queries";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const limit = Math.min(200, Math.max(1, Number(request.nextUrl.searchParams.get("limit") || 20)));
  const items = await listNotificationsForRecipientUser(auth.userId, limit);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}

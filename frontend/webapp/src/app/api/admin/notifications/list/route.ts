import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api-guard";
import { listNotificationsForRecipientUser } from "@/features/notification/db/admin-notification-count.queries";

export async function GET() {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const items = await listNotificationsForRecipientUser(auth.userId);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}

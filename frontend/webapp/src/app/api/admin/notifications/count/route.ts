import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api-guard";
import { getUnreadCountForRecipientUser } from "@/features/notification/db/admin-notification-count.queries";

export async function GET() {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const count = await getUnreadCountForRecipientUser(auth.userId);
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}

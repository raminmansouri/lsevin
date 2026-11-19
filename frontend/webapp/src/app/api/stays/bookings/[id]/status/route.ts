import { NextResponse } from "next/server";

import db from "@/config/database/db";
import { logUnexpected } from "@/features/stays/server/errors";
import { requireApiUser } from "@/lib/auth/api-guard";

export const dynamic = "force-dynamic";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The booking page polls this while it waits for the host (requested) or for payment, so an
 * accept/decline shows up without a refresh. Owner only; another account's id is a 404.
 * One indexed primary-key read, never cached.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  try {
    const [row] = await db<{ status: string; updated_at: Date }[]>`
      select status, updated_at from stay.bookings where booking_id = ${id}::uuid and user_id = ${auth.userId}::uuid`;
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ status: row.status, updatedAt: new Date(row.updated_at).toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    logUnexpected("stays.bookingStatus", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

import { NextResponse, type NextRequest } from "next/server";

import { bookingsCsv, parseRange } from "@/features/tours/server/admin/reports";
import { requireAdmin } from "@/features/tours/server/platform/access";
import { httpStatusFor, mapDbError, ToursError } from "@/features/tours/server/platform/errors";

/**
 * CSV export of tour bookings (M-022). The middleware gates /admin by URL;
 * the handler re-checks the session itself so it can never be served to a
 * non-admin by a routing change. Errors keep their category (a database
 * outage is a 503, never a 400).
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireAdmin();
    const p = request.nextUrl.searchParams;
    const range = parseRange({
      from: p.get("from") ?? undefined, to: p.get("to") ?? undefined, calendar: p.get("calendar") ?? undefined,
      timezone: p.get("tz") ?? undefined, providerId: p.get("provider") ?? undefined,
    });
    const csv = await bookingsCsv(actor, range);
    return new NextResponse(csv.body, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${csv.filename}"`,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (e) {
    const err = e instanceof ToursError ? e : mapDbError(e, "admin.exportBookings");
    return NextResponse.json({ ok: false, error: { kind: err.kind, code: err.code, details: err.details } }, { status: httpStatusFor[err.kind] });
  }
}

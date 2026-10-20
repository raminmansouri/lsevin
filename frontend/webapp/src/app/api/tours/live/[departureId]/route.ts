import { NextResponse } from "next/server";

import { currentActor } from "@/features/tours/server/platform/access";
import { httpStatusFor, mapDbError, ToursError } from "@/features/tours/server/platform/errors";
import { getLiveView } from "@/features/tours/server/ops/live";

/**
 * Live trip polling for the signed-in traveler (C-070..C-080, AT-19).
 * Authorization is per departure inside getLiveView; the position is returned
 * only to people allowed to see it and only while tracking is active.
 */
export const dynamic = "force-dynamic";
// No `export const runtime`: this Next.js canary (cacheComponents/useCache) rejects that
// route config (see src/app/api/booking-v2/uploads/route.ts). Node.js is the default.

export async function GET(_request: Request, context: { params: Promise<{ departureId: string }> }) {
  const { departureId } = await context.params;
  try {
    const actor = await currentActor();
    const view = await getLiveView(actor, departureId);
    return NextResponse.json({ ok: true, data: view }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const err = e instanceof ToursError ? e : mapDbError(e, "api.tours.live");
    return NextResponse.json({ ok: false, error: { kind: err.kind, code: err.code } }, { status: httpStatusFor[err.kind], headers: { "Cache-Control": "no-store" } });
  }
}

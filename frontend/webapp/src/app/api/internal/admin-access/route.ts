import { NextResponse } from "next/server";

import type { AdminAccess } from "@/lib/admin/access/policy";
import { AdminAccessInfrastructureError, loadAdminAccess } from "@/lib/admin/access/store";
import { getSession } from "@/lib/auth/session";

/**
 * What may the signed-in person do in the admin panel?
 *
 * The Edge middleware cannot query Postgres, so for a plain `admin` token it asks this route
 * (same pod, over loopback) and keeps the answer for a few seconds. It is not a secret: the
 * response describes only the caller's own access, derived from their own session cookie, and
 * an anonymous caller gets `none`.
 *
 * Failure is reported as 503 and never as a permissive answer — the middleware turns it into a
 * "service unavailable" page rather than letting anyone through on a database blip.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const none: AdminAccess = { kind: "none", reason: "not-admin" };
  try {
    const session = await getSession().catch(() => null);
    const roles = (session?.user?.roles ?? []).map((r) => String(r));
    const access = await loadAdminAccess(session?.user?.id, roles);
    return NextResponse.json(
      { access: session?.user?.id ? access : none },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof AdminAccessInfrastructureError) {
      return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    console.error("[admin-access] unexpected error in internal route", error);
    return NextResponse.json({ error: "unexpected" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

import { NextResponse, type NextRequest } from "next/server";

import { actionPages } from "@/lib/admin/access/action-manifest";
import type { AdminAccess } from "@/lib/admin/access/policy";
import { AdminAccessInfrastructureError, loadAdminAccess } from "@/lib/admin/access/store";
import { getSession } from "@/lib/auth/session";

/**
 * What may the signed-in person do in the admin panel — and, when asked, which pages import a given
 * server action?
 *
 * The Edge middleware cannot query Postgres or read build output, so for a plain `admin` token it asks
 * this route (same pod, over loopback) and keeps the answer for a few seconds.
 *
 *   GET /api/internal/admin-access               -> { access }
 *   GET /api/internal/admin-access?action=<id>   -> { actionPages: string[] | null }   (null = unknown id)
 *
 * Neither is a secret: the first describes only the caller's own access, derived from their own
 * session cookie (an anonymous caller gets `none`); the second names page entries of a public
 * JavaScript bundle. Failure is reported as 503 and never as a permissive answer — the middleware
 * turns it into a "service unavailable" page rather than letting anyone through.
 */
export const dynamic = "force-dynamic";

const ACTION_ID = /^[0-9a-f]{20,80}$/i;
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const none: AdminAccess = { kind: "none", reason: "not-admin" };

  const action = request.nextUrl.searchParams.get("action");
  if (action !== null) {
    if (!ACTION_ID.test(action)) return NextResponse.json({ error: "bad action id" }, { status: 400, headers: NO_STORE });
    const result = actionPages(action);
    if (!result.ok) return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
    return NextResponse.json({ actionPages: result.pages }, { headers: NO_STORE });
  }

  try {
    const session = await getSession().catch(() => null);
    const roles = (session?.user?.roles ?? []).map((r) => String(r));
    const access = await loadAdminAccess(session?.user?.id, roles);
    return NextResponse.json({ access: session?.user?.id ? access : none }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof AdminAccessInfrastructureError) {
      return NextResponse.json({ error: "unavailable" }, { status: 503, headers: NO_STORE });
    }
    console.error("[admin-access] unexpected error in internal route", error);
    return NextResponse.json({ error: "unexpected" }, { status: 500, headers: NO_STORE });
  }
}

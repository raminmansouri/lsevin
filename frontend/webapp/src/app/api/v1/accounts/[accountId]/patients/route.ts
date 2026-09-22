import { NextRequest, NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/api-guard";
import { listPatientsForAccount } from "@/features/patients/server/repository";

type Context = { params: Promise<{ accountId: string }> };

/** V0.7: GET /api/v1/accounts/{id}/patients (paginated). */
export async function GET(request: NextRequest, context: Context) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { accountId } = await context.params;
  const { searchParams } = request.nextUrl;
  const limit = Number(searchParams.get("limit") ?? 50);
  const offset = Number(searchParams.get("offset") ?? 0);
  const items = await listPatientsForAccount(accountId, { limit, offset });
  return NextResponse.json({ items, limit, offset });
}

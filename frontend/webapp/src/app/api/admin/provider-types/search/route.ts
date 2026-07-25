
import { NextRequest, NextResponse } from "next/server";

import { listProviderTypes, providerTypeProblem } from "@/features/provider-types/db/provider-types.repository";
import { requireApiAdmin } from "@/lib/auth/api-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAdmin();
    if (auth instanceof NextResponse) return auth;

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const locale = request.nextUrl.searchParams.get("Locale") ?? "fa-IR";
    const result = await listProviderTypes(params, locale);
    return NextResponse.json(result);
  } catch (error) {
    const problem = providerTypeProblem(error);
    return NextResponse.json(problem, { status: problem.status });
  }
}

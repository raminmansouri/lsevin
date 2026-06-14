
import { NextRequest, NextResponse } from "next/server";

import { listProviderTypes, providerTypeProblem } from "@/features/provider-types/db/provider-types.repository";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const locale = request.nextUrl.searchParams.get("Locale") ?? "fa-IR";
    const result = await listProviderTypes(params, locale);
    return NextResponse.json(result);
  } catch (error) {
    const problem = providerTypeProblem(error);
    return NextResponse.json(problem, { status: problem.status });
  }
}

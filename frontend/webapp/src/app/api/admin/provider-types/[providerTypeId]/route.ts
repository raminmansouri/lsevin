
import { NextRequest, NextResponse } from "next/server";

import { getProviderType, providerTypeProblem } from "@/features/provider-types/db/provider-types.repository";
import { requireApiAdmin } from "@/lib/auth/api-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ providerTypeId: string }> }
) {
  try {
    const auth = await requireApiAdmin();
    if (auth instanceof NextResponse) return auth;

    const { providerTypeId } = await params;
    const providerType = await getProviderType(providerTypeId);

    if (!providerType) {
      return NextResponse.json(
        { title: "Not found", detail: "Provider type was not found.", status: 404 },
        { status: 404 }
      );
    }

    return NextResponse.json(providerType);
  } catch (error) {
    const problem = providerTypeProblem(error);
    return NextResponse.json(problem, { status: problem.status });
  }
}

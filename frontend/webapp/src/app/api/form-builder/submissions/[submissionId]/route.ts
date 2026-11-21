import { NextResponse } from "next/server";
import { getFormSubmissionAdmin } from "@/features/form-builder/server/admin-repository";
import { requireApiAdmin } from "@/lib/auth/api-guard";

// Admin only: a single submission holds one customer's intake answers.
export async function GET(_request: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const { submissionId } = await params;
    const item = await getFormSubmissionAdmin(submissionId);

    if (!item) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load submission" },
      { status: 500 }
    );
  }
}

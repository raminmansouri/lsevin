import { NextResponse } from "next/server";
import { getFormSubmissionAdmin } from "@/features/form-builder/server/admin-repository";

export async function GET(_request: Request, { params }: { params: Promise<{ submissionId: string }> }) {
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

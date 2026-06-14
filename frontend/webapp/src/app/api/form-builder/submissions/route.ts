import { NextResponse } from "next/server";
import { listFormSubmissionsAdmin } from "@/features/form-builder/server/admin-repository";
import { saveDynamicFormSubmission } from "@/features/form-builder/server/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const items = await listFormSubmissionsAdmin({
      formId: searchParams.get("formId"),
      formVersionId: searchParams.get("formVersionId"),
      status: searchParams.get("status"),
      submissionScope: searchParams.get("submissionScope"),
      q: searchParams.get("q"),
      limit: Number(searchParams.get("limit") || 50),
      offset: Number(searchParams.get("offset") || 0),
    });

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load submissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.formVersionId) {
      return NextResponse.json({ error: "formVersionId is required" }, { status: 400 });
    }

    if (!body?.payload || typeof body.payload !== "object") {
      return NextResponse.json({ error: "payload object is required" }, { status: 400 });
    }

    const item = await saveDynamicFormSubmission(body, body.submittedByUserId ?? null);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save submission" },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { saveDynamicFormSubmission } from "@/features/form-builder/server/repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get("x-user-id") ?? null;

    const result = await saveDynamicFormSubmission(body, userId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/form-builder/submissions failed", error);
    return NextResponse.json({ message: "Failed to save form submission" }, { status: 500 });
  }
}

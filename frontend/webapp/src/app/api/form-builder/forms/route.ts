
import { NextRequest, NextResponse } from "next/server";
import { upsertFormDefinition } from "@/features/form-builder/server/repository";
import { getFormForDesigner, listFormsAdmin } from "@/features/form-builder/server/admin-repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId");
    if (formId) {
      const item = await getFormForDesigner(formId);
      return NextResponse.json({ item });
    }
    const items = await listFormsAdmin();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/form-builder/forms failed", error);
    return NextResponse.json({ message: "Failed to load forms" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await upsertFormDefinition(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/form-builder/forms failed", error);
    return NextResponse.json({ message: "Failed to save form definition" }, { status: 500 });
  }
}

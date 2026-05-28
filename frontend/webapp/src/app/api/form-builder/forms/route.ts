import { NextResponse } from "next/server";
import { listFormsAdmin, getFormForDesigner } from "@/features/form-builder/server/admin-repository";
import { upsertFormDefinition } from "@/features/form-builder/server/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const formId = searchParams.get("formId");

  try {
    if (formId) {
      const item = await getFormForDesigner(formId);
      if (!item) return NextResponse.json({ error: "Form not found" }, { status: 404 });
      return NextResponse.json({ item });
    }

    const items = await listFormsAdmin();
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load forms" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await upsertFormDefinition(body);
    return NextResponse.json({ item: result, result, formId: result.formId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save form" },
      { status: 400 }
    );
  }
}

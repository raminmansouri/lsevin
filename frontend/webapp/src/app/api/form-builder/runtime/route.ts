import { NextResponse } from "next/server";
import { getRuntimeForm } from "@/features/form-builder/server/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const item = await getRuntimeForm({
      serviceDefinitionId: searchParams.get("serviceDefinitionId"),
      usageScope: searchParams.get("usageScope") === "child_addon_booking" ? "child_addon_booking" : "main_booking",
      formId: searchParams.get("formId"),
      formKey: searchParams.get("formKey"),
      formVersionId: searchParams.get("formVersionId"),
    });

    if (!item) return NextResponse.json({ error: "Runtime form not found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load runtime form" },
      { status: 500 }
    );
  }
}

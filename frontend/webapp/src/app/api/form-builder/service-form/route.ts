import { NextRequest, NextResponse } from "next/server";
import { getActiveServiceForm } from "@/features/form-builder/server/repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceDefinitionId = searchParams.get("serviceDefinitionId");
    const usageScope = (searchParams.get("usageScope") as "main_booking" | "child_addon_booking" | null) ?? "main_booking";

    if (!serviceDefinitionId) {
      return NextResponse.json({ message: "serviceDefinitionId is required" }, { status: 400 });
    }

    const form = await getActiveServiceForm(serviceDefinitionId, usageScope);
    return NextResponse.json({ form });
  } catch (error) {
    console.error("GET /api/form-builder/service-form failed", error);
    return NextResponse.json({ message: "Failed to load service form" }, { status: 500 });
  }
}

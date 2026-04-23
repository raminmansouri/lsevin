import { NextRequest, NextResponse } from "next/server";
import { upsertFormDefinition } from "@/features/form-builder/server/repository";

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

import { NextRequest, NextResponse } from "next/server";
import { draftSaveSchema } from "@/features/booking-v2/lib/schema";
import { listOpenDrafts, resolveCurrentUserId, saveDraft } from "@/features/booking-v2/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request);
    const drafts = await listOpenDrafts(userId);
    return NextResponse.json({ drafts });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load pending drafts." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request);
    const payload = draftSaveSchema.parse(await request.json());
    const draft = await saveDraft(userId, payload);
    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to save draft booking." },
      { status: 400 },
    );
  }
}

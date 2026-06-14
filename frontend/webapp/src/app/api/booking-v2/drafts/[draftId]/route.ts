import { NextRequest, NextResponse } from "next/server";
import { draftSaveSchema } from "@/features/booking-v2/lib/schema";
import { getDraftById, resolveCurrentUserId, saveDraft } from "@/features/booking-v2/lib/repository";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ draftId: string }> },
) {
  try {
    const userId = await resolveCurrentUserId(request);
    const { draftId } = await context.params;
    const draft = await getDraftById(draftId, userId);
    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load draft booking." },
      { status: 404 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ draftId: string }> },
) {
  try {
    const userId = await resolveCurrentUserId(request);
    const { draftId } = await context.params;
    const payload = draftSaveSchema.parse(await request.json());
    const draft = await saveDraft(userId, { ...payload, draftId });
    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update draft booking." },
      { status: 400 },
    );
  }
}

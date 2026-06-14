import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/features/booking-v2/lib/schema";
import { finalizeCheckout, resolveCurrentUserId } from "@/features/booking-v2/lib/repository";

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request);
    const payload = checkoutSchema.parse(await request.json());
    const result = await finalizeCheckout(userId, payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to finalize checkout." },
      { status: 400 },
    );
  }
}

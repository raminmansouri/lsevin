import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkoutSchema } from "@/features/booking-v2/lib/schema";
import { finalizeCheckout, resolveCurrentUserId } from "@/features/booking-v2/lib/repository";

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveCurrentUserId(request);
    const payload = checkoutSchema.parse(await request.json());
    const result = await finalizeCheckout(userId, payload);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "BOOKING_SLOT_PASSED") {
      return NextResponse.json({ error: "BOOKING_SLOT_PASSED" }, { status: 409 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid booking details." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to finalize checkout." },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAvailableDates } from "@/features/booking-v2/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const specialistId = url.searchParams.get("specialistId");

    if (!specialistId) {
      return NextResponse.json({ dates: [] });
    }

    const dates = await getAvailableDates({ specialistId });
    return NextResponse.json({ dates });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load available dates." },
      { status: 500 },
    );
  }
}

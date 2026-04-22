import { NextRequest, NextResponse } from "next/server";
import { getAvailableTimes } from "@/features/booking-v2/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const specialistId = url.searchParams.get("specialistId");
    const serviceId = url.searchParams.get("serviceId");
    const selectedDate = url.searchParams.get("selectedDate");

    if (!specialistId || !serviceId || !selectedDate) {
      return NextResponse.json({ times: [] });
    }

    const times = await getAvailableTimes({ specialistId, serviceId, selectedDate });
    return NextResponse.json({ times });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load available times." },
      { status: 500 },
    );
  }
}

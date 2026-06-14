import { NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/features/booking-v2/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const locale = url.searchParams.get("locale") || "fa";
    const providerId = url.searchParams.get("providerId");
    const serviceId = url.searchParams.get("serviceId");
    const specialistId = url.searchParams.get("specialistId");

    const data = await getCatalog({
      providerId,
      serviceId,
      specialistId,
      locale,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load booking catalog." },
      { status: 500 },
    );
  }
}

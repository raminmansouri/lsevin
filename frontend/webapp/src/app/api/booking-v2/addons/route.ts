import { NextRequest, NextResponse } from "next/server";
import { getAddons } from "@/features/booking-v2/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const serviceId = url.searchParams.get("serviceId");
    const includeLsevin = url.searchParams.get("includeLsevin") === "true";
    const locale = url.searchParams.get("locale") || "en";

    if (!serviceId) {
      return NextResponse.json({ addons: [] });
    }

    const addons = await getAddons({ serviceId, includeLsevin, locale });
    return NextResponse.json({ addons });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load add-ons." },
      { status: 500 },
    );
  }
}

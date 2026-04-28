import { NextRequest, NextResponse } from "next/server";

import { getProviderPageDataFromDb } from "@/features/service-providers/server/provider-page.repository";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const providerId = searchParams.get("id") || searchParams.get("providerId");
  const locale = searchParams.get("locale") || request.headers.get("x-locale") || "en-US";

  const result = await getProviderPageDataFromDb({
    providerId: providerId || "",
    locale,
    targetCurrencyCode: searchParams.get("currency") || searchParams.get("targetCurrencyCode"),
    selectedCountryCode: searchParams.get("country") || searchParams.get("selectedCountryCode"),
    browserCountryCode: searchParams.get("browserCountry") || searchParams.get("browserCountryCode"),
    userId: searchParams.get("userId"),
  });

  if (result.error || !result.data) {
    return NextResponse.json(
      result.error || { title: "Could not load provider page.", status: 500 },
      { status: result.error?.status || 500 }
    );
  }

  return NextResponse.json(result.data);
}

import { NextRequest, NextResponse } from "next/server";

import { getProviderPageDataFromDb } from "@/features/service-providers/server/provider-page.repository";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const providerId = searchParams.get("id") || searchParams.get("providerId");
  const locale = searchParams.get("locale") || request.headers.get("x-locale") || "fa-IR";

  const result = await getProviderPageDataFromDb({
    providerId: providerId || "",
    locale,
    targetCurrencyCode: searchParams.get("currency") || searchParams.get("targetCurrencyCode"),
    selectedCountryCode: searchParams.get("country") || searchParams.get("selectedCountryCode"),
    // Falls back to the Caddy GeoIP header (same pattern as x-locale above) so
    // display currency can default by country even when the client hasn't
    // explicitly passed one — display only, never used for payment/gateway
    // selection (that stays phone-number-based, see payment/server/gateway-eligibility.ts).
    browserCountryCode:
      searchParams.get("browserCountry") ||
      searchParams.get("browserCountryCode") ||
      request.headers.get("x-country"),
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

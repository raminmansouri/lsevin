import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { AttributeFilterValue } from "@/features/home/types";
import { getServiceProvidersByType } from "@/features/service-providers/api/server/get-service-providers-by-type";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerTypeId = searchParams.get("ProviderTypeId");
  const search = searchParams.get("Search");
  const page = searchParams.get("PageNumber");
  const pageSize = searchParams.get("PageSize");
  const forMap = searchParams.get("ForMap") === "true";
  const countryCode = searchParams.get("CountryCode");
  const cityCode = searchParams.get("CityCode");
  const attributeFiltersParam = searchParams.get("AttributeFilters");
  const locale = searchParams.get("Locale");
  if (!providerTypeId) {
    return NextResponse.json(
      { error: "ProviderTypeId is required" },
      { status: 400 }
    );
  }

  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  // Parse attribute filters if provided (sent as JSON array from client)
  let attributeFilters: AttributeFilterValue[] | undefined;
  if (attributeFiltersParam) {
    try {
      attributeFilters = JSON.parse(attributeFiltersParam);
    } catch {
      attributeFilters = undefined;
    }
  }

  const { data, error } = await getServiceProvidersByType(
    { locale: localeHeader, token },
    providerTypeId,
    {
      filters: search || "",
      startDate: "",
      endDate: "",
      pageNumber: page ? parseInt(page) : DEFAULT_PAGE_NUMBER,
      pageSize: pageSize ? parseInt(pageSize) : forMap ? 500 : DEFAULT_PAGE_SIZE,
      sortOrder: "",
      countryCode: countryCode || undefined,
      cityCode: cityCode || undefined,
      attributeFilters,
    }
  );

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}

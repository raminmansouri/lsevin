import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { getServiceDefinitions } from "@/features/service-definitions/api/server/get-service-definitions";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { getSearchHistory } from "@/features/service-providers/api/server/get-search-history";
import { getSearchResults } from "@/features/service-providers/api/server/get-search-results";
import { getExplore } from "@/features/service-providers/api/server/get-explore";

export async function GET(request: NextRequest) {
  console.log('explore called:')
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("Search");
  const page = searchParams.get("PageNumber");
  const pageSize = searchParams.get("PageSize");
  const locale = searchParams.get("Locale");
const priceRange= searchParams.get("priceRange");
const distance= searchParams.get("distance");
const minRating= searchParams.get("minRating");
const verifiedOnly= searchParams.get("verifiedOnly");
const languages= searchParams.get("languages");
const responseTime= searchParams.get("responseTime");

  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getExplore(
    { locale: localeHeader, token },
    {
      filters: search || "",
      startDate: "",
      endDate: "",
      pageNumber: page ? parseInt(page) : DEFAULT_PAGE_NUMBER,
      pageSize: pageSize ? parseInt(pageSize) : DEFAULT_PAGE_SIZE,
      sortOrder: "",
priceRange,
distance,
minRating,
verifiedOnly,
languages,
responseTime,
    }
  );

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}

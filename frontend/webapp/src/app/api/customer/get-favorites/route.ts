import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { getServiceDefinitions } from "@/features/service-definitions/api/server/get-service-definitions";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { getSearchHistory } from "@/features/service-providers/api/server/get-search-history";
import { getSearchResults } from "@/features/service-providers/api/server/get-search-results";
import { getGetFavorites } from "@/features/service-providers/api/server/get-GetFavorites";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  console.log('GetFavorites called:',searchParams)
  const search = searchParams.get("Search");
  const page = searchParams.get("PageNumber");
  const pageSize = searchParams.get("PageSize");
  const locale = searchParams.get("Locale");
const priceRange:any= searchParams.get("priceRange[]");
const distance:any= searchParams.get("distance");
const minRating:any= searchParams.get("minRating");
const verifiedOnly:any= searchParams.get("verifiedOnly");
const languages:any= searchParams.get("languages");
const responseTime:any= searchParams.get("responseTime");

  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getGetFavorites(
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

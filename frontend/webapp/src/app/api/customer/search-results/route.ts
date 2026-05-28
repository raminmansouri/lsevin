import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
<<<<<<< HEAD
import { getSearchResults } from "@/features/service-providers/server/search.repository";
import { LocaleTypes } from "@/types/common";

function first(searchParams: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value !== null && value !== undefined && value.trim() !== "") return value;
  }
  return null;
}

function parseLimit(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const term = first(searchParams, ["q", "term", "Search", "search", "filters", "query", "keyword"]);
  const locale = first(searchParams, ["Locale", "locale"]);
  const localeHeader = locale ? localeToHeader(locale as LocaleTypes) || locale : undefined;

  const data = await getSearchResults({
    term,
    locale: localeHeader,
    limit: parseLimit(first(searchParams, ["limit", "PageSize", "pageSize"])),
    categoryId: first(searchParams, ["categoryId", "category", "category_id"]),
    providerTypeId: first(searchParams, ["providerTypeId", "providerType", "provider_type_id"]),
    country: first(searchParams, ["country", "Country"]),
    city: first(searchParams, ["city", "City"]),
  });
=======
import { getServiceDefinitions } from "@/features/service-definitions/api/server/get-service-definitions";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { getSearchHistory } from "@/features/service-providers/api/server/get-search-history";
import { getSearchResults } from "@/features/service-providers/api/server/get-search-results";

export async function GET(request: NextRequest) {
  console.log('search-results called:')
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("Search");
  const page = searchParams.get("PageNumber");
  const pageSize = searchParams.get("PageSize");
  const locale = searchParams.get("Locale");
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getSearchResults(
    { locale: localeHeader, token },
    {
      filters: search || "",
      startDate: "",
      endDate: "",
      pageNumber: page ? parseInt(page) : DEFAULT_PAGE_NUMBER,
      pageSize: pageSize ? parseInt(pageSize) : DEFAULT_PAGE_SIZE,
      sortOrder: "",
    }
  );

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

  return NextResponse.json(data);
}

import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
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

  return NextResponse.json(data);
}

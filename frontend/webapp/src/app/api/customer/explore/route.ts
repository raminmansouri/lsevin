import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { getServiceDefinitions } from "@/features/service-definitions/api/server/get-service-definitions";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { getSearchHistory } from "@/features/service-providers/api/server/get-search-history";
import { getSearchResults } from "@/features/service-providers/api/server/get-search-results";
import { getExplore } from "@/features/service-providers/api/server/get-explore";

function firstParam(searchParams: URLSearchParams, ...keys: string[]) {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value != null && value.trim() !== "") return value.trim();
  }

  return null;
}

function numericParam(searchParams: URLSearchParams, ...keys: string[]) {
  const value = firstParam(searchParams, ...keys);
  if (value == null) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function collectNumericParams(searchParams: URLSearchParams, ...keys: string[]) {
  return keys
    .flatMap((key) => searchParams.getAll(key))
    .flatMap((value) => value.split(","))
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
}

function parsePriceRange(searchParams: URLSearchParams) {
  const explicitMin = numericParam(searchParams, "minPrice");
  const explicitMax = numericParam(searchParams, "maxPrice");

  let min = explicitMin ?? 0;
  let max = explicitMax ?? 0;

  if (explicitMin == null && explicitMax == null) {
    const range = collectNumericParams(searchParams, "priceRange[]", "priceRange");

    if (range.length >= 2) {
      min = range[0];
      max = range[1];
    } else if (range.length === 1) {
      min = 0;
      max = range[0];
    }
  }

  min = Math.max(0, min);
  max = Math.max(0, max);

  if (max > 0 && min > max) {
    return [max, min];
  }

  return [min, max];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  console.log('explore called:',searchParams)
  const search = searchParams.get("Search");
  const page = searchParams.get("PageNumber");
  const pageSize = searchParams.get("PageSize");
  const locale = searchParams.get("Locale");
  const priceRange = parsePriceRange(searchParams);
  const distance = numericParam(searchParams, "distance") ?? 0;
  const minRating = numericParam(searchParams, "minRating") ?? 0;
  const verifiedOnly = firstParam(searchParams, "verifiedOnly", "verified") ?? "";
  const languages = firstParam(searchParams, "languages") ?? "";
  const responseTime = firstParam(searchParams, "responseTime") ?? "any";
  const currencyCode = firstParam(searchParams, "currency", "currencyCode") ?? "";

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
      currencyCode,
    }
  );

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}

import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { getServiceDefinitionsAllLocales } from "@/features/service-definitions/api/server/get-service-definitions-all-locales";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, type FilterParams } from "@/types/filter";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search =
    searchParams.get("Search") ??
    searchParams.get("search") ??
    searchParams.get("q") ??
    searchParams.get("query") ??
    searchParams.get("keyword") ??
    "";
  const page = searchParams.get("PageNumber") ?? searchParams.get("pageNumber") ?? searchParams.get("page");
  const pageSize = searchParams.get("PageSize") ?? searchParams.get("pageSize") ?? searchParams.get("limit");
  const locale = searchParams.get("Locale");
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getServiceDefinitionsAllLocales(
    { locale: localeHeader, token },
    {
      Search: search,
      PageNumber: page ? parseInt(page, 10) : DEFAULT_PAGE_NUMBER,
      PageSize: pageSize ? parseInt(pageSize, 10) : DEFAULT_PAGE_SIZE,
    } as FilterParams
  );

  if (error) {
    return NextResponse.json(error, { status: error.status || 500 });
  }

  return NextResponse.json(data);
}

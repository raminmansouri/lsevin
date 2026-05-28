import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
<<<<<<< HEAD
import { getSearchHistory } from "@/features/service-providers/server/search.repository";
import { LocaleTypes } from "@/types/common";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("Locale") || searchParams.get("locale");
  const localeHeader = locale ? localeToHeader(locale as LocaleTypes) || locale : undefined;

  const data = await getSearchHistory(localeHeader);
=======
import { getServiceDefinitions } from "@/features/service-definitions/api/server/get-service-definitions";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { getSearchHistory } from "@/features/service-providers/api/server/get-search-history";

export async function GET(request: NextRequest) {
  console.log('get-search-history called:')
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("Search");
  const page = searchParams.get("PageNumber");
  const pageSize = searchParams.get("PageSize");
  const locale = searchParams.get("Locale");
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getSearchHistory(
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

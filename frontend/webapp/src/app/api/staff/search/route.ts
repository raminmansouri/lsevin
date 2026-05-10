import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { getStaff } from "@/features/staff/api/server/get-staff";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("Search") || searchParams.get("search") || searchParams.get("q") || "";
  const page = searchParams.get("PageNumber") || searchParams.get("page");
  const pageSize = searchParams.get("PageSize") || searchParams.get("pageSize");
  const locale = searchParams.get("Locale") || searchParams.get("locale") || "en";
  const localeHeader = localeToHeader(locale as LocaleTypes) || locale;
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getStaff(
    { locale: localeHeader, token },
    {
      filters: search,
      startDate: "",
      endDate: "",
      pageNumber: page ? parseInt(page, 10) : DEFAULT_PAGE_NUMBER,
      pageSize: pageSize ? parseInt(pageSize, 10) : DEFAULT_PAGE_SIZE,
      sortOrder: "",
    }
  );

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}

import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { getServiceDefinitions } from "@/features/service-definitions/api/server/get-service-definitions";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { getSearchHistory } from "@/features/service-providers/api/server/get-search-history";
import { getSearchResults } from "@/features/service-providers/api/server/get-search-results";
import { getExplore } from "@/features/service-providers/api/server/get-explore";
import { getNotificationCount } from "@/features/notification/api/server/get-notification-count";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("Locale");
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getNotificationCount(
    { locale: localeHeader, token }
  );

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}

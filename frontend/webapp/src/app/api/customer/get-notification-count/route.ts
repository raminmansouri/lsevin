<<<<<<< HEAD
import { NextResponse, type NextRequest } from "next/server";

import { getNotificationUnreadCountByCustomerId } from "@/features/notification/db/notification-count.queries";
import { resolveCurrentNotificationCustomerId } from "@/features/notification/server/current-notification-customer";
import { EMPTY_NOTIFICATION_COUNT } from "@/features/notification/types/notification-count";

export async function GET(request: NextRequest) {
  try {
    const locale = request.headers.get("x-lsevin-locale") || "en";
    const customerId = await resolveCurrentNotificationCustomerId({ request, locale });

    if (!customerId) {
      return NextResponse.json(EMPTY_NOTIFICATION_COUNT, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const data = await getNotificationUnreadCountByCustomerId(customerId);

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load notification count", error);

    return NextResponse.json(EMPTY_NOTIFICATION_COUNT, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }
=======
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
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
}

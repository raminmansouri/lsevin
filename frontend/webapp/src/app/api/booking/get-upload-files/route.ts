import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { getServiceDefinitions } from "@/features/service-definitions/api/server/get-service-definitions";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { getSearchHistory } from "@/features/service-providers/api/server/get-search-history";
import { getSearchResults } from "@/features/service-providers/api/server/get-search-results";
import { getGetUploadFiles } from "@/features/booking/api/server/get-upload-files";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  console.log('GetUploadFiles called:',searchParams)
  const search = searchParams.get("Search");
  const page = searchParams.get("PageNumber");
  const pageSize = searchParams.get("PageSize");
  const locale = searchParams.get("Locale");

    const providerId= searchParams.get("providerId");
    const serviceId= searchParams.get("serviceId");
    const specialistId= searchParams.get("specialistId");

    
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getGetUploadFiles(
    { locale: localeHeader, token },
    providerId,
    serviceId,
    specialistId
  );

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}

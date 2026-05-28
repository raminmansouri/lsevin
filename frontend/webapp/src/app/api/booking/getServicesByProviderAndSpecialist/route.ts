import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { getCategories } from "@/features/categories/api/server/get-categories";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { getProvidersByServiceAndSpecialist } from "@/features/booking/api/server/get-providers-by-service-and-specialist";
import { getServicesByProviderAndSpecialist } from "@/features/booking/api/server/get-services-by-provider-and-specialist";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("Search");
  const page = searchParams.get("PageNumber");
  const pageSize = searchParams.get("PageSize");
  const locale = searchParams.get("Locale");
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  const providerId = searchParams.get("providerId");
  const serviceId = searchParams.get("serviceId");
  const specialistId = searchParams.get("specialistId");

  
  const { data, error } = await getServicesByProviderAndSpecialist(
    { locale: localeHeader, token },
    {
      filters: search || "",
          providerId,
serviceId,
specialistId,
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

  return NextResponse.json(data);
}

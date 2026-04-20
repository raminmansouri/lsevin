import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { getCommentsByServiceProvider } from "@/features/service-providers/api/server/get-comments-by-service-provider";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { getProviderPageData } from "@/features/service-providers/api/server/get-provider-page-data";

export async function GET(
  request: NextRequest,
  // { params }: { params: Promise<{ id: string }> }
) {

  const id = request.nextUrl.searchParams.get("id"); // "1"

  if (!id) {
    return NextResponse.json(
      { error: "Missing id query param" },
      { status: 400 }
    );
  }
  
  console.log('request:',request)
  // console.log('params:',params)
  // const { id: serviceProviderId } = await params;
  const { searchParams } = new URL(request.url);

  const page = searchParams.get("PageNumber");
  const pageSize = searchParams.get("PageSize");
  const locale = searchParams.get("Locale");
  const localeHeader = localeToHeader(locale as LocaleTypes);

  // Get session - token may be null for anonymous users
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getProviderPageData(
    { locale: localeHeader, token }, // Token is optional
    id
  );

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}

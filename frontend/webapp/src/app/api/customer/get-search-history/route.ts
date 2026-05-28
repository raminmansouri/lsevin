import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { getSearchHistory } from "@/features/service-providers/server/search.repository";
import { LocaleTypes } from "@/types/common";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("Locale") || searchParams.get("locale");
  const localeHeader = locale ? localeToHeader(locale as LocaleTypes) || locale : undefined;

  const data = await getSearchHistory(localeHeader);

  return NextResponse.json(data);
}

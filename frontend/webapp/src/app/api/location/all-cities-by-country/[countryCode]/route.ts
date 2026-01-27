import { NextRequest, NextResponse } from "next/server";

import { getAllCitiesByCountry } from "@/features/shared/api/server/get-all-cities-by-country";
import { localeToHeader } from "@/features/shared/utils/localization";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";

interface Params {
  countryCode: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { countryCode } = await params;
  if (!countryCode || countryCode === "[countryCode]") {
    return NextResponse.json(
      {
        error: {
          status: 400,
          title: "Bad Request",
          detail: "Country code is required",
        },
      },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("Locale");
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getAllCitiesByCountry(
    { locale: localeHeader, token },
    countryCode
  );

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}

/* app/api/booking/get-booking-steps/route.ts */
import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { LocaleTypes } from "@/types/common";

import { getBookingSteps } from "@/features/booking/api/server/get-booking-steps";
import { getSession } from "@/lib/auth/session";

/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("Locale");
  const localeHeader = localeToHeader(locale as LocaleTypes);

  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getBookingSteps({
    locale: localeHeader,
    token,
  });

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}

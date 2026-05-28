/* app/api/booking/get-pending-booking/route.ts */
import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { localeToHeader } from "@/config/locales";
import { LocaleTypes } from "@/types/common";

import { getPendingBooking } from "@/features/booking/api/server/get-pending-booking";

/* ------------------------------------------------------------------ */
/*  GET /api/booking/get-pending-booking?Locale=en-US                */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("Locale");
  const localeHeader = localeToHeader(locale as LocaleTypes);

  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getPendingBooking({
    locale: localeHeader,
    token,
  });

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}

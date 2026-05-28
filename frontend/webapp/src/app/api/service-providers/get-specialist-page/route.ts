// src/app/api/booking/get-specialist-page/route.ts
import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { getSpecialistPageServer } from "@/features/service-providers/api/server/get-specialist-page";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";

export const GET = async (req: NextRequest) => {
  const url = new URL(req.url);
  const specialistId = url.searchParams.get("SpecialistId");
  const locale = url.searchParams.get("Locale");

  if (!specialistId) {
    return NextResponse.json(
      { error: "Missing SpecialistId" },
      { status: 400 }
    );
  }
  const localeHeader = localeToHeader(locale as LocaleTypes);

  const session = await getSession();
  const token = session?.user?.accessToken;

  try {
    const { data, error } = await getSpecialistPageServer(
      { locale: localeHeader, token }, // Token is optional
      specialistId
    );
    if (error) {
      return NextResponse.json(error, { status: error.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
};

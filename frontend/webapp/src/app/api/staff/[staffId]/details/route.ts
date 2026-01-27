import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/features/shared/utils/localization";
import { getStaffById } from "@/features/staff/api/server/get-staff-by-id";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  const { staffId } = await params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getStaffById(staffId, {
    locale: localeHeader,
    token,
  });

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}
